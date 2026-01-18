<script lang="ts">
	import { page } from '$app/state';
	import Globals from '$lib/globals.svelte';
	import { MapCtxKey, type Restaurant, type MapCtx } from '$lib/types';
	import { DicesIcon, Key, PinIcon } from '@lucide/svelte';
	import { getContext, type Component } from 'svelte';
	import { getDistance } from 'ol/sphere';
	import { formatDistance, portal } from '$lib/utils';
	import { fade, slide } from 'svelte/transition';
	import { Button } from '$lib/components/ui/button';

	type Color = `oklch(${number}% ${number} ${number})`;

	const mapCtx = getContext<MapCtx>(MapCtxKey);
	let restaurants = $derived<Restaurant[]>(page.data.restaurants);

	// Utility function to calculate background and text color with sufficient contrast
	function getColors(inputColor: Color) {
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

		const bgColor = `oklch(${bgLightness}% ${chroma} ${hue})` as Color;
		const textColor = `oklch(${textLightness}% ${adjustedChroma} ${hue})` as Color;

		return [bgColor, textColor];
	}

	function getNearestPoi(n = 5) {
		const userPos = Globals.getCurrentUserPosition();
		const sorted = restaurants
			.map((restaurant) => {
				const distance = getDistance(userPos, restaurant.coordinates);
				return { restaurant, distance };
			})
			.sort((a, b) => a.distance - b.distance)
			.slice(0, n);
		return sorted;
	}

	class QuickAction<T> {
		id: string;
		name: string;
		color: Color;
		icon: Component;
		result = $state<T | null>(null);

		constructor(id: string, name: string, color: Color, icon: Component) {
			this.id = id;
			this.name = name;
			this.color = color;
			this.icon = icon;
		}

		setResult(result: T | null) {
			this.result = result;
		}

		getResult(): T | null {
			return this.result;
		}
	}
	const nearMeAction = new QuickAction<{ distance: number; restaurant: Restaurant }[]>(
		'near-me',
		'Near Me',
		'oklch(68.1% 0.162 75.834)',
		PinIcon
	);

	const randomPoiAction = new QuickAction<null>(
		'random-poi',
		"Destiny's Call",
		'oklch(60.6% 0.25 292.717)',
		DicesIcon
	);

	const QUICK_ACTIONS = [nearMeAction, randomPoiAction];

	function handleQuickAction(id: string) {
		switch (id) {
			case 'near-me':
				const map = mapCtx.getMap();
				if (!map) return;
				const nearestPois = getNearestPoi();
				// Globals.mapFilterRestaurant = nearestPois.map((r) => r.id);
				nearMeAction.result = nearestPois;
				break;
			case 'random-poi':
				// Overly complicated way to get a random index, but crypto is more secure than Math.random :)
				const array = new Uint32Array(1);
				crypto.getRandomValues(array);
				const randomIndex = array[0] % restaurants.length;
				Globals.restaurantDetailsId = restaurants[randomIndex].id;
				break;
			default:
				console.warn(`Unknown quick action: ${id}`);
		}
	}
</script>

<!-- Near me restaurants list -->
{#if nearMeAction.getResult()}
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
		{#each nearMeAction.getResult() as { restaurant, distance } (restaurant.id)}
			<button
				onclick={() => {
					Globals.restaurantDetailsId = restaurant.id;
					nearMeAction.setResult(null);
				}}
				class="flex flex-row justify-between rounded border border-border p-2"
			>
				<div class="flex w-full flex-row items-center gap-2">
					<span class="text-lg">{restaurant.icon}</span>
					<p class="line-clamp-1 text-lg font-medium">
						{restaurant.name}
					</p>
					<span class="ml-auto text-muted-foreground">{formatDistance(distance)}</span>
				</div>
			</button>
		{/each}
		<Button
			variant="outline"
			onclick={() => {
				nearMeAction.setResult(null);
			}}>Close</Button
		>
	</div>
{/if}

<div class="no-scrollbar mr-2 flex grow flex-row flex-nowrap gap-2 overflow-x-auto pl-2">
	{#each QUICK_ACTIONS as { id, name, color, icon: Icon } (id)}
		{@const [bg, fg] = getColors(color)}
		<button
			class="flex shrink-0 flex-row items-center gap-1 rounded-full border border-(--bg-color) bg-(--bg-color)/50 px-1 py-0.5 text-sm font-medium text-(--text-color) backdrop-blur-xs"
			style="--bg-color: {bg}; --text-color: {fg};"
			onclick={() => handleQuickAction(id)}
		>
			<Icon class="size-4" />
			<span>{name}</span>
		</button>
	{/each}
</div>
