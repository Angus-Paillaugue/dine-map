<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import Globals from '$lib/globals.svelte';
	import type { NewReview, Restaurant } from '$lib/types';
	import { fade, scale, slide } from 'svelte/transition';
	import * as Field from '$lib/components/ui/field';
	import { Textarea } from '$lib/components/ui/textarea';
	import Rating from './Rating.svelte';
	import { invalidateAll } from '$app/navigation';
	import { formatDate } from '$lib/utils';
	import * as Empty from '$lib/components/ui/empty';
	import { Plus, UtensilsCrossed } from '@lucide/svelte';

	let restaurant = $derived(
		(page.data.restaurants as Restaurant[]).find((r) => r.id === Globals.restaurantDetailsId) ||
			null
	);
	let reviewOpen = $state(false);
	let newReview = $state<NewReview>({
		rating: 5,
		comment: '',
		// svelte-ignore state_referenced_locally
		restaurantId: ''
	});
	let isCreatingReview = $state(false);

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
		const data = await res.json();
		if (!res.ok) {
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
		if (!reviewOpen) {
			newReview.rating = 5;
			newReview.comment = '';
		}
	});
</script>

<svelte:window on:keydown={(e) => {
	if (e.key === 'Escape' && reviewOpen) {
		reviewOpen = false;
	}
}} />

{#if restaurant}
	<div
		class="fixed inset-0 z-40 flex flex-col gap-4 bg-background p-2"
		transition:slide={{ axis: 'y', duration: 400 }}
	>
		<div class="flex flex-row items-center justify-between">
			<h1 class="shrink-0 text-xl font-medium">
				{restaurant.name}
			</h1>
			<Rating rating={restaurant.rating} compact={true} />
		</div>
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
						<Button onclick={() => (reviewOpen = true)}>Review</Button>
					</div>
				</Empty.Content>
			</Empty.Root>
		{:else}
			<div class="flex grow flex-col gap-2 overflow-y-auto">
				{#each restaurant.reviews as review}
					<div class="relative space-y-2 rounded border border-border p-3">
						<div class="flex flex-row items-center justify-between gap-4">
							<Rating rating={review.rating} compact={true} />
							<span class="text-sm text-muted-foreground">{formatDate(review.date)}</span>
						</div>
						<p>{review.comment}</p>
					</div>
				{/each}
			</div>
			<Button class="mt-auto flex shrink-0 flex-row gap-2" onclick={() => (reviewOpen = true)}>
				New review
				<Plus class="size-4" />
			</Button>
		{/if}
		<Button
			variant="outline"
			class="mt-auto shrink-0"
			onclick={() => (Globals.restaurantDetailsId = null)}
		>
			Close
		</Button>
	</div>
	{#if reviewOpen}
		<div
			class="fixed inset-0 z-40 bg-background/50 backdrop-blur-xs"
			transition:fade={{ duration: 200 }}
		></div>
		<div
			class="fixed top-1/2 left-1/2 z-40 w-full max-w-[90%] -translate-x-1/2 -translate-y-1/2 space-y-6 rounded border border-border bg-card p-4"
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
						id="newReviewComment"
						placeholder="Your comment on the place"
						class="resize-none"
					/>
				</Field.Field>
			</div>

			<div class="flex flex-row items-center justify-end gap-2">
				<Button variant="secondary" onclick={() => (reviewOpen = false)} disabled={isCreatingReview}
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
