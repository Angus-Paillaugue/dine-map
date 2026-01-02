<script lang="ts">
	import type { Restaurant } from '$lib/types';
	import { Overlay } from 'svelte-openlayers';
	import { ChevronRight, UtensilsCrossed } from '@lucide/svelte';
	import Rating from './Rating.svelte';
	import { emojiToSvgDataUrl, formatDate } from '$lib/utils';
	import { Separator } from '$lib/components/ui/separator';
	import { Button } from '$lib/components/ui/button';
	import Globals from '$lib/globals.svelte';
	import * as Empty from '$lib/components/ui/empty';

	interface Props {
		maxReviewsToShow?: number;
	}

	let { maxReviewsToShow = 4 }: Props = $props();

	const processedStyles: Record<string, ReturnType<typeof emojiToSvgDataUrl>> = {};

	// Provide a style (or style function) that returns the icon-style for the feature.
	function selectStyle(feature: any) {
		const props = (feature?.getProperties?.() || {}) as Partial<Restaurant>;
		const emoji = props.icon || '🍔';
		const name = props.name || 'Unknown';
		const key = `${emoji}:${name}`;

		if (processedStyles[key]) return processedStyles[key];

		const style = emojiToSvgDataUrl({ emoji, size: 40, name });
		processedStyles[key] = style;
		return style;
	}
</script>

<Overlay.TooltipManager
	hoverTooltip={true}
	selectTooltip={true}
	{selectStyle}
	hoverClass="!bg-transparent !shadow-none"
	selectClass="!bg-transparent !shadow-none"
>
	{#snippet hoverSnippet(feature)}
		{@const { name, rating, icon } = feature.getProperties() as Restaurant}
		<div
			class="flex flex-row items-center gap-4 rounded border border-border bg-card px-4 py-2 shadow"
		>
			<div class="font-mono text-base font-bold">{icon} {name}</div>
			<div class="h-fit rounded-full bg-secondary px-2">
				<Rating {rating} compact={true} />
			</div>
		</div>
	{/snippet}

	{#snippet selectSnippet(feature)}
		{@const {
			rating: ratingScore,
			name,
			reviews,
			id,
			icon
		} = feature.getProperties() as Restaurant}
		<div
			class="w-[80dvw] max-w-125 space-y-4 overflow-hidden rounded border border-border bg-card p-4"
		>
			<div class="flex flex-row items-center justify-between gap-8">
				<p class="line-clamp-2 font-mono text-xl font-bold">{icon} {name}</p>
				{#if reviews.length > 0}
					<Rating rating={ratingScore} compact={true} />
				{/if}
			</div>

			<Separator />

			{#if reviews.length === 0}
				<Empty.Root>
					<Empty.Header>
						<Empty.Media variant="icon">
							<UtensilsCrossed />
						</Empty.Media>
						<Empty.Title>No Reviews yet</Empty.Title>
						<Empty.Description>
							You haven't reviewed <b>{name}</b> yet.
						</Empty.Description>
					</Empty.Header>
				</Empty.Root>
			{:else}
				<div class="relative flex max-h-[50dvh] flex-col gap-4 overflow-y-auto pt-2">
					{#each reviews.slice(0, maxReviewsToShow) as review}
						<div class="relative rounded-md border border-border p-2">
							<span
								class="absolute top-0 right-3 -translate-y-1/2 bg-card text-xs text-muted-foreground"
								>{formatDate(review.date)}</span
							>
							<div class="absolute top-0 left-3 -translate-y-1/2 bg-card">
								<Rating rating={review.rating} compact={true} />
							</div>
							<p>{review.comment}</p>
						</div>
					{/each}
					{#if reviews.length > maxReviewsToShow}
						<p class="text-center text-sm text-muted-foreground">
							And {reviews.length - maxReviewsToShow} more review{reviews.length -
								maxReviewsToShow >
							1
								? 's'
								: ''}...
						</p>
					{/if}
				</div>
			{/if}

			<Button
				class="mt-4 flex w-full flex-row gap-2"
				onclick={() => (Globals.restaurantDetailsId = id)}
			>
				More details
				<ChevronRight class="size-4 rtl:rotate-180" />
			</Button>
		</div>
	{/snippet}
</Overlay.TooltipManager>
