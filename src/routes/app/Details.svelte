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
	import { goto, invalidateAll } from '$app/navigation';
	import { cn, DIETARY_INFO_DISPLAY, formatDate } from '$lib/utils';
	import * as Empty from '$lib/components/ui/empty';
	import * as ContextMenu from '$lib/components/ui/context-menu';
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
	import Calendar from '$lib/components/ui/calendar/calendar.svelte';
	import * as Popover from '$lib/components/ui/popover';
	import { Label } from '$lib/components/ui/label';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { getLocalTimeZone, CalendarDate, today } from '@internationalized/date';
	import { resolve } from '$app/paths';

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
	let newReview = $state<Omit<NewReview, 'createdBy' | 'date'> & { date: CalendarDate }>({
		rating: 5,
		comment: '',
		restaurantId: '',
		date: today(getLocalTimeZone())
	});
	let editReview = $state({
		id: '',
		open: false,
		calendarOpen: false,
		fields: { rating: 5, comment: '', date: today(getLocalTimeZone()) }
	});
	let createReviewStates = $state({ processing: false, dateSelectorOpen: false });
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
		createReviewStates.processing = true;
		const res = await fetch('/api/review', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ ...newReview, date: newReview.date.toDate(getLocalTimeZone()) })
		});
		if (!res.ok) {
			Toaster.error('Failed to create review');
			const data = await res.json();
			console.error('Failed to create review:', data);
			createReviewStates.processing = false;
			return;
		}
		await invalidateAll();
		createReviewStates.processing = false;
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
				calendarOpen: false,
				fields: {
					rating: 5,
					comment: '',
					date: today(getLocalTimeZone())
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
				calendarOpen: false,
				fields: {
					rating: 5,
					comment: '',
					date: today(getLocalTimeZone())
				}
			};
		} else {
			editReview = {
				id: review.id,
				open: true,
				calendarOpen: false,
				fields: {
					rating: review.rating,
					comment: review.comment,
					date: new CalendarDate(
						review.date.getFullYear(),
						review.date.getMonth() + 1,
						review.date.getDate()
					)
				}
			};
		}
	};

	async function submitEdit() {
		const updatedReview = {
			...editReview.fields,
			date: editReview.fields.date.toDate(getLocalTimeZone()),
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
			calendarOpen: false,
			fields: {
				rating: 5,
				comment: '',
				date: today(getLocalTimeZone())
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

	// TODO: make this work from pages outside `/app`
	async function showRouteToPoi(poi: Restaurant) {
		isCalculatingRoute = true;
		await Globals.showRouteToPoi(poi);
		isCalculatingRoute = false;
		Globals.restaurantDetailsId = null;
		goto(resolve('/'), { replaceState: true });
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
	<div class="relative flex flex-col rounded border border-border p-3">
		{#if isEditingReview}
			<div class="flex flex-col gap-2" transition:slide={{ duration: 200, axis: 'y' }}>
				<div class="grid grid-cols-2 pr-12">
					<Field.Field>
						<Field.Label for="editReviewRating">Rating</Field.Label>
						<Rating
							rating={editReview.fields.rating}
							id="editReviewRating"
							onStarClick={(starIndex) => (editReview.fields.rating = starIndex + 1)}
						/>
					</Field.Field>
					<div class="flex flex-col gap-3">
						<Label for="editReviewDate" class="px-1">Date of visit</Label>
						<Popover.Root bind:open={editReview.calendarOpen}>
							<Popover.Trigger id="editReviewDate">
								{#snippet child({ props })}
									<Button {...props} variant="outline" class="w-full justify-between font-normal">
										{editReview.fields.date
											? editReview.fields.date.toDate(getLocalTimeZone()).toLocaleDateString()
											: 'Select date'}
										<ChevronDownIcon />
									</Button>
								{/snippet}
							</Popover.Trigger>
							<Popover.Content class="w-auto overflow-hidden p-0" align="start">
								<Calendar
									type="single"
									bind:value={editReview.fields.date}
									captionLayout="dropdown"
									onValueChange={() => {
										createReviewStates.dateSelectorOpen = false;
									}}
									maxValue={today(getLocalTimeZone())}
								/>
							</Popover.Content>
						</Popover.Root>
					</div>
				</div>
				<Field.Field>
					<Field.Label for="editReviewComment">Comment</Field.Label>
					<Textarea
						autoFit={{ active: true, minRows: 3, maxRows: 10 }}
						bind:value={editReview.fields.comment}
						id="editReviewComment"
						placeholder="Your comment on the place"
						class="resize-none"
					/>
				</Field.Field>
			</div>
		{:else}
			<div transition:slide={{ duration: 200, axis: 'y' }}>
				<ContextMenu.Root>
					<ContextMenu.Trigger class="flex flex-col gap-2">
						<div class="pointer-events-none flex flex-row items-center gap-4">
							<Rating rating={review.rating} compact={true} />
							<span class="text-sm text-muted-foreground">-</span>
							<span class="text-sm text-muted-foreground">{formatDate(review.date)}</span>
						</div>
						{#if review.comment}
							<p class="whitespace-pre-wrap">{review.comment}</p>
						{/if}
					</ContextMenu.Trigger>
					<ContextMenu.Content class="w-52">
						<ContextMenu.Item onclick={() => toggleEdit(review.id)}>
							<Pen class="size-4" />
							Edit
						</ContextMenu.Item>
						<ContextMenu.Item variant="destructive" onclick={() => deleteReview(review.id)}>
							<Trash2 class="size-4" />
							Delete
						</ContextMenu.Item>
					</ContextMenu.Content>
				</ContextMenu.Root>
			</div>
		{/if}

		{#if isEditingReview}
			<div
				class="absolute top-2 right-2 flex flex-col items-end gap-2 transition-all"
				transition:slide={{ duration: 200, axis: 'y' }}
			>
				<Button
					size="icon-sm"
					class={'rounded-full'}
					variant={'outline'}
					onclick={() => {
						toggleEdit(review.id);
					}}
				>
					<span class="size-4" in:scale={{ duration: 200 }}>
						<X class="size-4" />
					</span>
				</Button>
				<Button size="icon-sm" variant="default" class="rounded-full" onclick={submitEdit}>
					<Save class="size-4" />
				</Button>
			</div>
		{/if}
	</div>
{/snippet}

{#if restaurant}
	<div class="fixed inset-0 z-30 bg-card p-2" transition:fade={{ duration: 200 }}>
		<div
			class="flex h-full flex-col gap-4 rounded bg-background p-2"
			transition:scale={{ duration: 200, start: 0.5 }}
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
				<Button class="flex shrink-0 flex-row gap-2" onclick={() => (reviewOpen = true)}>
					New review
					<Plus class="size-4" />
				</Button>
				<div class="flex grow flex-col gap-2 overflow-y-auto">
					{#each restaurant.reviews as review (review.id)}
						{@render reviewCard(review)}
					{/each}
				</div>
			{/if}

			<!-- Footer -->
			<div class="mt-auto flex shrink-0 flex-col gap-4">
				{#if restaurant.dietaryInfo && Object.values(restaurant.dietaryInfo).some((e) => e === true)}
					<div class="flex flex-row flex-nowrap gap-2 overflow-x-auto">
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
					<Button
						variant="outline"
						class="grow"
						onclick={() => (Globals.restaurantDetailsId = null)}
					>
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
				<div class="flex flex-col gap-6">
					<div class="grid grid-cols-2">
						<Field.Field>
							<Field.Label for="newReviewRating">Rating</Field.Label>
							<Rating
								rating={newReview.rating}
								id="newReviewRating"
								onStarClick={(starIndex) => (newReview.rating = starIndex + 1)}
							/>
						</Field.Field>
						<div class="flex flex-col gap-3">
							<Label for="newReviewDate" class="px-1">Date of visit</Label>
							<Popover.Root bind:open={createReviewStates.dateSelectorOpen}>
								<Popover.Trigger id="newReviewDate">
									{#snippet child({ props })}
										<Button {...props} variant="outline" class="w-full justify-between font-normal">
											{newReview.date
												? newReview.date.toDate(getLocalTimeZone()).toLocaleDateString()
												: 'Select date'}
											<ChevronDownIcon />
										</Button>
									{/snippet}
								</Popover.Trigger>
								<Popover.Content class="w-auto overflow-hidden p-0" align="start">
									<Calendar
										type="single"
										bind:value={newReview.date}
										captionLayout="dropdown"
										onValueChange={() => {
											createReviewStates.dateSelectorOpen = false;
										}}
										maxValue={today(getLocalTimeZone())}
									/>
								</Popover.Content>
							</Popover.Root>
						</div>
					</div>
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
					<Button
						variant="outline"
						onclick={() => (reviewOpen = false)}
						disabled={createReviewStates.processing}>Cancel</Button
					>
					<Button
						variant="default"
						onclick={submitReview}
						disabled={createReviewStates.processing}
						loading={createReviewStates.processing}>Create</Button
					>
				</div>
			</div>
		{/if}
	</div>
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
