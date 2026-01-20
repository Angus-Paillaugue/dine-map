<script lang="ts">
	import Globals from '$lib/globals.svelte';
	import { type OKLCHColor, type Restaurant } from '$lib/types';
	import { portal } from '$lib/utils';
	import { fade, slide } from 'svelte/transition';
	import { Button } from '$lib/components/ui/button';
	import AnimateLoad from '$lib/components/AnimateLoad.svelte';
	import { QUICK_ACTIONS, type ActionReturn } from './actions';
	import { page } from '$app/state';
	import { pillIcon } from './actions/registry.svelte';

	let restaurants = $derived<Restaurant[]>(page.data.restaurants);
	let outputRestaurants = $state<ActionReturn[]>([]);

	// Utility function to calculate background and text color with sufficient contrast
	function getColors(inputColor: OKLCHColor) {
		const [lightness, chroma, hue] = inputColor.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
		// Ensure sufficient contrast by setting a minimum lightness difference
		const minLightness = 20; // Minimum lightness for dark text
		const maxLightness = 90; // Maximum lightness for light text
		const contrastThreshold = 60; // Minimum contrast difference for readability
		const adjustedLightness = lightness * 0.5 + 5; // Assuming the black background has ~5% lightness

		let bgLightness = adjustedLightness;
		let textLightness;

		if (adjustedLightness > 50) {
			textLightness = Math.max(adjustedLightness - contrastThreshold, minLightness); // Darker text for light backgrounds
		} else {
			textLightness = Math.min(adjustedLightness + contrastThreshold, maxLightness); // Lighter text for dark backgrounds
		}

		// Clamp chroma to ensure the colors remain visually distinct
		const adjustedChroma = Math.min(chroma, 0.1);

		const bgColor = `oklch(${bgLightness}% ${chroma} ${hue})` as OKLCHColor;
		const textColor = `oklch(${textLightness}% ${adjustedChroma} ${hue})` as OKLCHColor;

		return [bgColor, textColor];
	}
</script>

<!-- Near me restaurants list -->
{#if outputRestaurants.length > 0}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-30 bg-background/50 backdrop-blur-xs"
		use:portal
		transition:fade={{ duration: 300 }}
	></div>
	<div
		use:portal
		class="fixed top-1/2 left-1/2 z-30 flex max-h-[90vh] w-[90%] max-w-125 -translate-x-1/2 -translate-y-1/2 flex-col gap-2 rounded border border-border bg-card p-4 px-2 py-4"
		transition:slide={{ duration: 300 }}
	>
		<div class=" no-scrollbar flex h-fit max-h-full flex-col gap-2 overflow-y-auto">
			{#each outputRestaurants as { restaurant, trailing } (restaurant.id)}
				<button
					onclick={() => {
						Globals.restaurantDetailsId = restaurant.id;
						outputRestaurants = [];
					}}
					class="flex flex-row justify-between rounded border border-border p-2"
				>
					<div class="flex w-full flex-row items-center gap-2">
						<span class="text-lg">{restaurant.icon}</span>
						<p class="line-clamp-1 text-lg font-medium">
							{restaurant.name}
						</p>
						<div class="ml-auto">
							{#if trailing}
								{#if typeof trailing === 'string'}
									<span class="text-sm text-muted-foreground">{trailing}</span>
								{:else}
									{@render trailing.snippet(trailing.params as never)}
								{/if}
							{/if}
						</div>
					</div>
				</button>
			{/each}
		</div>
		<Button
			variant="outline"
			onclick={() => {
				outputRestaurants = [];
			}}>Close</Button
		>
	</div>
{/if}

<AnimateLoad
	class="no-scrollbar absolute top-2 right-0 left-0 z-10 flex grow flex-row flex-nowrap items-center gap-2 overflow-x-auto px-2"
>
	{#each QUICK_ACTIONS as { id, name, color, onClick } (id)}
		{@const [bg, fg] = getColors(color)}
		<button
			class="flex shrink-0 flex-row items-center gap-1 rounded-full border border-(--bg-color) bg-(--bg-color)/50 px-2 py-0.5 text-sm font-medium text-(--text-color) backdrop-blur-xs"
			style="--bg-color: {bg}; --text-color: {fg};"
			onclick={() => {
				outputRestaurants = onClick(restaurants) || outputRestaurants;
			}}
		>
			{@render pillIcon(id)}
			<span>{name}</span>
		</button>
	{/each}
</AnimateLoad>
