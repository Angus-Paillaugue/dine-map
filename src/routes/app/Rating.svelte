<script lang="ts">
	import { Star } from '@lucide/svelte';
	import type { SvelteHTMLElements } from 'svelte/elements';

	interface Props {
		rating: number;
		compact?: boolean;
		filledColor?: string;
		emptyColor?: string;
		showStars?: boolean;
		showLabel?: boolean;
		onStarClick?: (starIndex: number) => void;
	}

	let {
		rating = $bindable(0),
		compact = false,
		filledColor = 'oklch(68.1% 0.162 75.834)',
		emptyColor = '#ffffff',
		showStars = true,
		showLabel = true,
		onStarClick = () => {},
		...restProps
	}: Props & SvelteHTMLElements['div'] = $props();
</script>

{#if compact}
	{@const partiallyFilledPercentage = Math.min(Math.max(rating, 0), 5) * 20}
	<div class="inline-flex flex-row items-center gap-1" {...restProps}>
		{#if showStars}
			<div class="relative size-4">
				<Star class="size-full" style="stroke: {emptyColor}; fill: {emptyColor};" />
				<Star
					class="absolute inset-0 size-full overflow-hidden"
					style="clip-path: inset(0 {100 -
						partiallyFilledPercentage}% 0 0); stroke: {filledColor}; fill: {filledColor};"
				/>
			</div>
		{/if}
		{#if showLabel}
			<spam class="font-mono text-sm">{rating.toFixed(1)}</spam>
		{/if}
	</div>
{:else}
	<div class="flex flex-row items-center gap-1" {...restProps}>
		{#if showStars}
			{#each Array(5), i}
				{@const fullyFilled = rating >= i + 1}
				{@const partiallyFilledPercentage = Math.min(Math.max(rating - i, 0), 1) * 100}
				<button
					onclick={() => {
						onStarClick(i);
					}}
					class="relative size-4"
				>
					{#if fullyFilled}
						<Star class="size-full" style="stroke: {filledColor}; fill: {filledColor};" />
					{:else if partiallyFilledPercentage > 0}
						<Star class="size-full" style="stroke: {emptyColor}; fill: {emptyColor};" />
						<Star
							class="absolute inset-0 size-full overflow-hidden"
							style="clip-path: inset(0 {100 -
								partiallyFilledPercentage}% 0 0); stroke: {filledColor}; fill: {filledColor};"
						/>
					{:else}
						<Star class="size-full" style="stroke: {emptyColor}; fill: {emptyColor};" />
					{/if}
				</button>
			{/each}
		{/if}
		{#if showLabel}
			<spam class="font-mono text-sm">{rating.toFixed(1)}</spam>
		{/if}
	</div>
{/if}
