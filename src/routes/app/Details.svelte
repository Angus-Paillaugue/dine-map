<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import Globals from '$lib/globals.svelte';
	import {
		RestaurantNameMaxLength,
		type DietaryInfo,
		type List,
		type NewReview,
		type Restaurant,
		type Review
	} from '$lib/types';
	import { fade, scale, slide } from 'svelte/transition';
	import * as Field from '$lib/components/ui/field';
	import { Textarea } from '$lib/components/ui/textarea';
	import Rating from './Rating.svelte';
	import { invalidateAll } from '$app/navigation';
	import { cn, DIETARY_INFO_DISPLAY, formatDate } from '$lib/utils';
	import * as Empty from '$lib/components/ui/empty';
	import {
		Bookmark,
		Pen,
		Plus,
		Route,
		Save,
		Star,
		Trash2,
		UtensilsCrossed,
		X
	} from '@lucide/svelte';
	import EmojiPicker from '$lib/components/emojiPicker/emojiPicker.svelte';
	import Toaster from '$lib/components/Toast';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { tick } from 'svelte';
	import { Spinner } from '$lib/components/ui/spinner';

	let restaurant = $derived(
		(page.data.restaurants as Restaurant[]).find((r) => r.id === Globals.restaurantDetailsId) ||
			null
	);
	let restaurantLists = $derived(
		(page.data.lists as List[]).filter((list) =>
			list.restaurants.map((r) => r.id).includes(restaurant?.id || '')
		)
	);
	let isCalculatingRoute = $state(false);
	let reviewOpen = $state(false);
	let newReview = $state<Omit<NewReview, 'createdBy'>>({
		rating: 5,
		comment: '',
		restaurantId: ''
	});
	let editReview = $state({ id: '', open: false, fields: { rating: 5, comment: '' } });
	let isCreatingReview = $state(false);
	let deleteStates = $state({ confirmOpen: false, processing: false });
	let editPOIName = $state<{
		name: string;
		open: boolean;
		input: HTMLInputElement | null;
	}>({ name: '', open: false, input: null });

	// On open
	$effect(() => {
		if (restaurant) {
			newReview.restaurantId = restaurant.id;
		}
	});

	async function submitReview() {
		isCreatingReview = true;
		const res = await fetch('/api/review', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(newReview)
		});
		if (!res.ok) {
			Toaster.error('Failed to create review');
			const data = await res.json();
			console.error('Failed to create review:', data);
			isCreatingReview = false;
			return;
		}
		await invalidateAll();
		isCreatingReview = false;
		reviewOpen = false;
	}

	$effect(() => {
		// Rest fields on close
		if (!Globals.restaurantDetailsId) {
			newReview.rating = 5;
			newReview.comment = '';
			deleteStates = { confirmOpen: false, processing: false };
			editReview = {
				id: '',
				open: false,
				fields: {
					rating: 5,
					comment: ''
				}
			};
		}
	});

	async function updateRestaurant(newData: Partial<Restaurant>) {
		if (!restaurant) return;
		const updatedRestaurant = { ...restaurant, ...newData, id: restaurant.id };
		const res = await fetch('/api/restaurant', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(updatedRestaurant)
		});
		if (!res.ok) {
			Toaster.error('Failed to update restaurant');
			const data = await res.json();
			console.error('Failed to update restaurant:', data);
			return;
		}
		await invalidateAll();
	}

	async function deleteRestaurant() {
		if (!restaurant) return;
		deleteStates.processing = true;
		const res = await fetch('/api/restaurant', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ id: restaurant.id })
		});
		if (!res.ok) {
			Toaster.error('Failed to delete restaurant');
			const data = await res.json();
			console.error('Failed to delete restaurant:', data);
			deleteStates.processing = false;
			return;
		}
		deleteStates.processing = false;
		Globals.restaurantDetailsId = null;
		await invalidateAll();
	}

	const toggleEdit = (reviewId: Review['id']) => {
		const review = restaurant?.reviews.find((r) => r.id === reviewId);
		if (!review) return;
		if (editReview.open && editReview.id === review.id) {
			editReview = {
				id: '',
				open: false,
				fields: {
					rating: 5,
					comment: ''
				}
			};
		} else {
			editReview = {
				id: review.id,
				open: true,
				fields: {
					rating: review.rating,
					comment: review.comment
				}
			};
		}
	};

	async function submitEdit() {
		const updatedReview = {
			...editReview.fields,
			id: editReview.id
		};
		const res = await fetch('/api/review', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(updatedReview)
		});
		if (!res.ok) {
			Toaster.error('Failed to update review');
			const data = await res.json();
			console.error('Failed to update review:', data);
			return;
		}
		await invalidateAll();
		toggleEdit(editReview.id);
	}

	async function deleteReview(reviewId: Review['id']) {
		const res = await fetch('/api/review', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ id: reviewId })
		});
		if (!res.ok) {
			Toaster.error('Failed to delete review');
			const data = await res.json();
			console.error('Failed to delete review:', data);
			return;
		}
		await invalidateAll();
		editReview = {
			id: '',
			open: false,
			fields: {
				rating: 5,
				comment: ''
			}
		};
	}

	async function onEditPOINameBlur() {
		editPOIName.open = false;
		const newName = editPOIName.name.trim();
		if (newName && newName !== restaurant?.name) {
			await updateRestaurant({ name: newName });
		} else if (!newName && restaurant?.name) {
			editPOIName.name = restaurant.name;
		}
	}

	async function showRouteToPoi(poi: Restaurant) {
		isCalculatingRoute = true;
		await Globals.showRouteToPoi(poi);
		isCalculatingRoute = false;
		Globals.restaurantDetailsId = null;
	}
</script>

<svelte:window
	on:keydown={(e) => {
		if (e.key === 'Escape' && reviewOpen) {
			reviewOpen = false;
		}
	}}
/>

{#snippet reviewCard(review: Review)}
	{@const isEditingReview = editReview.open && editReview.id === review.id}
	<div class="relative flex flex-col gap-2 rounded border border-border p-3">
		{#if isEditingReview}
			<div class="flex flex-col gap-2" transition:slide={{ duration: 200, axis: 'y' }}>
				<Field.Field>
					<Field.Label for="editReviewRating">Rating</Field.Label>
					<Rating
						rating={editReview.fields.rating}
						id="editReviewRating"
						onStarClick={(starIndex) => (editReview.fields.rating = starIndex + 1)}
					/>
				</Field.Field>
				<Field.Field>
					<Field.Label for="editReviewComment">Comment</Field.Label>
					<Textarea
						bind:value={editReview.fields.comment}
						id="editReviewComment"
						placeholder="Your comment on the place"
						class="resize-none"
					/>
				</Field.Field>
			</div>
		{:else}
			<div class="flex flex-col gap-2" transition:slide={{ duration: 200, axis: 'y' }}>
				<div class="flex flex-row items-center gap-4">
					<Rating rating={review.rating} compact={true} />
					<span class="text-sm text-muted-foreground">-</span>
					<span class="text-sm text-muted-foreground">{formatDate(review.date)}</span>
				</div>
				{#if review.comment}
					<p>{review.comment}</p>
				{/if}
			</div>
		{/if}

		<div
			class={cn(
				'absolute top-0 right-0 flex flex-col items-end transition-all',
				isEditingReview && 'pt-2 pr-2'
			)}
		>
			<div class="flex flex-row">
				{#if isEditingReview}
					<div class="mr-2" transition:slide={{ duration: 200, axis: 'x' }}>
						<Button
							size="icon-sm"
							variant="destructive"
							class="rounded-full"
							onclick={() => deleteReview(review.id)}
						>
							<Trash2 class="size-4" />
						</Button>
					</div>
				{/if}
				<Button
					size="icon-sm"
					class={isEditingReview ? 'rounded-full' : 'rounded'}
					variant={isEditingReview ? 'outline' : 'default'}
					onclick={() => {
						toggleEdit(review.id);
					}}
				>
					{#if isEditingReview}
						<span class="size-4" in:scale={{ duration: 200 }}>
							<X class="size-4" />
						</span>
					{:else}
						<span class="size-4" in:scale={{ duration: 200 }}>
							<Pen class="size-full" />
						</span>
					{/if}
				</Button>
			</div>
			{#if isEditingReview}
				<div class="mt-2 w-fit" transition:slide={{ duration: 200, axis: 'y' }}>
					<Button size="icon-sm" variant="default" class="rounded-full" onclick={submitEdit}>
						<Save class="size-4" />
					</Button>
				</div>
			{/if}
		</div>
	</div>
{/snippet}

{#if restaurant}
	<div
		class="fixed inset-0 z-30 flex flex-col gap-4 bg-background p-2"
		transition:slide={{ axis: 'y', duration: 400 }}
	>
		<div class="flex flex-row items-center justify-between gap-2">
			<div class="flex grow flex-row gap-2">
				<EmojiPicker
					onSelect={(emoji) => {
						updateRestaurant({ icon: emoji });
					}}
					selectedEmoji={restaurant.icon}
				>
					<div
						class="relative flex size-8 flex-col items-center justify-center overflow-hidden rounded-[42%] border border-border bg-secondary"
					>
						<span class="text-xl">{restaurant.icon}</span>
					</div>
				</EmojiPicker>
				<button
					class="flex grow flex-row items-center gap-2 text-xl font-medium"
					aria-label="Edit place name"
					onclick={async () => {
						if (!editPOIName.open) {
							editPOIName.name = restaurant.name;
							editPOIName.open = true;
							await tick();
							editPOIName.input?.focus();
							editPOIName.input?.select();
						}
					}}
				>
					{#if editPOIName.open}
						<InputGroup.Root>
							<InputGroup.Input
								bind:ref={editPOIName.input}
								bind:value={editPOIName.name}
								placeholder="The place's name"
								class="h-8 w-full"
								onblur={onEditPOINameBlur}
								onkeydown={(event) => {
									if (event.key === 'Enter') {
										onEditPOINameBlur();
									}
								}}
								maxlength={RestaurantNameMaxLength}
							/>
							<InputGroup.Addon align="inline-end" class="text-xs"
								>{editPOIName.name.length}/{RestaurantNameMaxLength}</InputGroup.Addon
							>
						</InputGroup.Root>
					{:else}
						<h1 class="line-clamp-1 w-full shrink-0 text-start text-xl font-medium">
							{restaurant.name}
						</h1>
					{/if}
				</button>
			</div>
			<Rating rating={restaurant.rating} compact={true} />
		</div>
		<!-- Restaurant in list pills -->
		<div class="flex flex-row items-center justify-between">
			<div class="flex grow flex-row flex-nowrap gap-2 overflow-x-auto">
				{#each restaurantLists as list (list.id)}
					<div class="relative w-max rounded border-border bg-card px-2 py-0.5">
						<div class="absolute inset-0 overflow-hidden rounded">
							<span
								class="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 text-[120px] opacity-10 blur-xl"
								>{list.icon}</span
							>
						</div>
						<span class="font-medium text-nowrap whitespace-nowrap">{list.icon} {list.name}</span>
					</div>
				{/each}
			</div>

			<div class="flex flex-row gap-2">
				<!-- manage place bookmarks button -->
				<Button
					class="shrink-0"
					variant="outline"
					size="icon-sm"
					aria-label="Calculate route to this location"
					onclick={() => showRouteToPoi(restaurant)}
				>
					{#if isCalculatingRoute}
						<span class="size-4" in:scale={{ duration: 200 }}>
							<Spinner class="size-full" />
						</span>
					{:else}
						<span class="size-4" in:scale={{ duration: 200 }}>
							<Route class="size-full" />
						</span>
					{/if}
				</Button>
				<Button
					class="shrink-0"
					size="icon-sm"
					onclick={() => (Globals.toggleList = restaurant.id)}
				>
					<Bookmark class="size-4" />
				</Button>
			</div>
		</div>

		<!-- Main content (empty or reviews list) -->
		{#if restaurant.reviews.length === 0}
			<Empty.Root>
				<Empty.Header>
					<Empty.Media variant="icon">
						<UtensilsCrossed />
					</Empty.Media>
					<Empty.Title>No Reviews yet</Empty.Title>
					<Empty.Description>
						You haven't reviewed <b>{restaurant.name}</b> yet, click the button below to do so!
					</Empty.Description>
				</Empty.Header>
				<Empty.Content>
					<div class="flex gap-2">
						<Button
							variant="outline"
							class="flex flex-row gap-2"
							onclick={() => (Globals.toggleList = restaurant.id)}
						>
							<Bookmark class="size-4" />
							Bookmark
						</Button>
						<Button class="flex flex-row gap-2" onclick={() => (reviewOpen = true)}>
							<Star class="size-4" />
							Review
						</Button>
					</div>
				</Empty.Content>
			</Empty.Root>
		{:else}
			<div class="flex grow flex-col gap-2 overflow-y-auto">
				{#each restaurant.reviews as review (review.id)}
					{@render reviewCard(review)}
				{/each}
			</div>
			<Button class="mt-auto flex shrink-0 flex-row gap-2" onclick={() => (reviewOpen = true)}>
				New review
				<Plus class="size-4" />
			</Button>
		{/if}

		<!-- Footer -->
		<div class="mt-auto flex shrink-0 flex-col">
			{#if restaurant.dietaryInfo && Object.values(restaurant.dietaryInfo).some((e) => e === true)}
				<div class="mb-2 flex flex-row flex-nowrap gap-2 overflow-x-auto">
					{#each Object.entries(restaurant.dietaryInfo).filter(([, v]) => v === true) as [type]}
						{@const info = DIETARY_INFO_DISPLAY[type as keyof DietaryInfo]}
						<div
							class="flex flex-row items-center gap-2 rounded-full border border-border bg-card px-2 py-1"
						>
							<info.icon class="size-4" style="color: {info.color};" />
							<span class="text-sm capitalize">{type}</span>
						</div>
					{/each}
				</div>
			{/if}
			<div class="flex flex-row gap-2">
				<Button variant="destructive" onclick={() => (deleteStates.confirmOpen = true)}>
					<Trash2 class="size-4 shrink-0" />
				</Button>
				<Button variant="outline" class="grow" onclick={() => (Globals.restaurantDetailsId = null)}>
					Close
				</Button>
			</div>
		</div>
	</div>
	<!-- New review dialog -->
	{#if reviewOpen}
		<div
			class="fixed inset-0 z-30 bg-background/50 backdrop-blur-xs"
			transition:fade={{ duration: 200 }}
		></div>
		<div
			class="fixed top-1/2 left-1/2 z-30 w-[90%] max-w-125 -translate-x-1/2 -translate-y-1/2 space-y-6 rounded border border-border bg-card p-4"
			transition:scale={{ duration: 200, start: 0.5 }}
		>
			<h2 class="text-xl font-medium">New review for {restaurant.name}</h2>
			<div class="flex flex-col gap-2">
				<Field.Field>
					<Field.Label for="newReviewRating">Rating</Field.Label>
					<Rating
						rating={newReview.rating}
						id="newReviewRating"
						onStarClick={(starIndex) => (newReview.rating = starIndex + 1)}
					/>
				</Field.Field>
				<Field.Field>
					<Field.Label for="newReviewComment">Comment</Field.Label>
					<Textarea
						bind:value={newReview.comment}
						autoFit={{ active: true, minRows: 3, maxRows: 10 }}
						id="newReviewComment"
						placeholder="Your comment on the place"
						class="resize-none"
					/>
				</Field.Field>
			</div>

			<div class="flex flex-row items-center justify-end gap-2">
				<Button variant="outline" onclick={() => (reviewOpen = false)} disabled={isCreatingReview}
					>Cancel</Button
				>
				<Button
					variant="default"
					onclick={submitReview}
					disabled={isCreatingReview}
					loading={isCreatingReview}>Create</Button
				>
			</div>
		</div>
	{/if}
{/if}

<!-- Delete POI confirm dialog -->
{#if deleteStates.confirmOpen && restaurant}
	<div
		class="fixed inset-0 z-30 bg-background/50 backdrop-blur-xs"
		transition:fade={{ duration: 200 }}
	></div>
	<div
		class="fixed top-1/2 left-1/2 z-30 w-[90%] max-w-125 -translate-x-1/2 -translate-y-1/2 space-y-6 rounded border border-border bg-card p-4"
		transition:scale={{ duration: 200, start: 0.5 }}
	>
		<h2 class="text-xl font-medium">Delete {restaurant.name}</h2>
		<p>Are you sure you want to delete this restaurant? This action cannot be undone.</p>

		<div class="flex flex-row items-center justify-end gap-2">
			<Button
				variant="outline"
				onclick={() => (deleteStates.confirmOpen = false)}
				disabled={deleteStates.processing}>Cancel</Button
			>
			<Button
				variant="destructive"
				onclick={deleteRestaurant}
				disabled={deleteStates.processing}
				loading={deleteStates.processing}>Delete</Button
			>
		</div>
	</div>
{/if}
