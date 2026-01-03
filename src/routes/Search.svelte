<script module>
	export interface SearchResult {
		place_id: number;
		name: string;
		coordinates: Coordinates;
		type: string;
		address: {
			[key: string]: string;
		};
		boundingBox: Viewbox;
	}
</script>

<script lang="ts">
	import type { Restaurant, Coordinates, Viewbox, NewRestaurant } from '$lib/types';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { Spinner } from '$lib/components/ui/spinner';
	import { SearchIcon } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { page } from '$app/state';
	import { cn, isSamePlace } from '$lib/utils';
	import { fade, fly, scale, slide } from 'svelte/transition';
	import Toaster from '$lib/components/Toast';
	import Globals from '$lib/globals.svelte';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';

	let open = $state(false);
	let searchInput = $state<HTMLInputElement | null>(null);
	let viewBox = $derived(Globals.viewBox);
	let restaurants = $derived<Restaurant[]>(page.data.restaurants);
	let searchResults = $state<SearchResult[]>([]);
	let abortController = $state<AbortController | null>(null);
	let loading = $state(false);

	const searchPlaceholders = [
		'sushi near me',
		'italian restaurants',
		'best ramen',
		'vegan cafes',
		'cozy bistros',
		'seafood places',
		'mexican food',
		'french cuisine',
		'bbq joints',
		'dessert spots'
	].sort(() => Math.random() - 0.5); // Shuffle
	let searchPlaceholder = $state<{
		index: number;
		timeout: ReturnType<typeof setTimeout> | null;
	}>({
		index: 0,
		timeout: null
	});

	// Search places within the current viewBox
	async function search(query: string) {
		if (!viewBox || query.length <= 2) return [];
		const transformResult = (response: any[]): SearchResult[] => {
			return response.map((result) => ({
				place_id: result.place_id,
				name: result.name,
				coordinates: [parseFloat(result.lon), parseFloat(result.lat)],
				type: result.type,
				address: result.address,
				boundingBox: (result.boundingbox as string[])
					.map((val) => parseFloat(val))
					.concat([0, 0, 0, 0])
					.slice(0, 4) as Viewbox
			}));
		};
		try {
			const res = await fetch(
				`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&layer=poi&viewbox=${viewBox.join(',')}&bounded=1`,
				{
					signal: abortController?.signal
				}
			);
			const results = await res.json();
			if (!res.ok || !Array.isArray(results)) {
				throw new Error('Invalid response from search API');
			}
			return transformResult(results);
		} catch (error) {
			const msg =
				error instanceof Error ? error.message : 'An unknown error occurred during search';
			Toaster.error(msg);
			return [];
		}
	}

	function onSearchInput() {
		if (!searchInput) return;
		if (abortController) {
			abortController.abort();
		}
		abortController = new AbortController();
		loading = true;
		search(searchInput.value || '').then((results) => {
			searchResults = results;
			loading = false;
			open = true;
		});
	}

	// Focus
	$effect(() => {
		if (!open) {
			if (searchInput) searchInput.value = '';
			searchResults = [];
		} else {
			searchInput?.focus();
		}
	});

	async function onResultSelect(
		searchResult: SearchResult,
		associatedPlace: Restaurant | undefined
	) {
		open = false;
		// If we have already rated the search for place, open its details
		if (associatedPlace) {
			Globals.restaurantDetailsId = associatedPlace.id;
		} else {
			// Otherwise we create it
			createRestaurant({
				name: searchResult.name,
				coordinates: searchResult.coordinates
			})
				.then(async (newRestaurant) => {
					await invalidateAll();
					Globals.restaurantDetailsId = newRestaurant.id;
				})
				.catch((error) => {
					Toaster.error('Error creating restaurant');
					console.error('Error creating restaurant:', error);
				});
		}
	}

	async function createRestaurant(restaurant: NewRestaurant) {
		const response = await fetch('/api/restaurant', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(restaurant)
		});

		if (!response.ok) {
			throw new Error('Failed to create restaurant');
		}

		const newRestaurant: Restaurant = await response.json();
		return newRestaurant;
	}

	function onWindowKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			open = false;
		}
	}

	const nextPlaceholder = $derived(() => {
		return (searchPlaceholder.index + 1) % searchPlaceholders.length;
	});

	onMount(() => {
		searchPlaceholder.timeout = setInterval(() => {
			searchPlaceholder.index = nextPlaceholder();
		}, 4000);

		return () => {
			if (searchPlaceholder.timeout) clearInterval(searchPlaceholder.timeout);
		};
	});
</script>

<svelte:window onkeydown={onWindowKeydown} />

<!-- Backdrop -->
{#if open}
	<button
		aria-label="Dismiss search"
		class="absolute inset-0 z-20 bg-background/50 backdrop-blur-xs"
		transition:fade={{ duration: 200 }}
		onclick={() => (open = false)}
	></button>
{/if}

<div class="pointer-events-none fixed inset-0 z-20 flex flex-col justify-end p-4">
	<!-- Page search input -->
	<InputGroup.Root class="pointer-events-auto relative bg-card! shadow-lg shadow-background">
		<InputGroup.Input
			bind:ref={searchInput}
			debounceDelay={800}
			onfocus={() => (open = true)}
			onDebounced={onSearchInput}
		/>
		{#if !open}
			<span
				class="pointer-events-none absolute top-0 right-9 bottom-0 left-9 flex flex-col justify-center overflow-hidden"
				transition:fade={{ duration: 200 }}
			>
				<div class="ietms-center flex w-full flex-row">
					<span class="text-sm text-muted-foreground">Search for</span>
					<div class="relative">
						{#each searchPlaceholders as p, i (p)}
							{#if i === searchPlaceholder.index}
								<span
									class={cn(
										'absolute top-1/2 left-full ml-1 -translate-y-1/2 text-sm font-medium text-nowrap text-foreground'
									)}
									in:fly={{ y: -20 }}
									out:fly={{ y: 20 }}
								>
									{searchPlaceholders[i]}
								</span>
							{/if}
						{/each}
					</div>
				</div>
			</span>
		{/if}
		<InputGroup.Addon>
			<SearchIcon />
		</InputGroup.Addon>
		<InputGroup.Addon align="inline-end">
			{#if loading}
				<span transition:scale={{ duration: 200 }}><Spinner /></span>
			{/if}
		</InputGroup.Addon>
	</InputGroup.Root>
	<!-- Search results -->
	{#if searchResults.length > 0}
		<div class="mt-4 flex flex-col gap-2">
			{#each searchResults as result}
				{@const associatedPlace = restaurants.find((rest) =>
					isSamePlace(rest.coordinates, result.coordinates)
				)}
				<div
					class="pointer-events-auto flex w-full flex-row items-center justify-between gap-2 rounded border border-border bg-card p-4"
				>
					<div class="flex flex-col gap-1">
						<p class="text-base font-medium">
							{result.name || 'Unnamed Place'}
						</p>
						<p class="line-clamp-1 text-sm font-light text-muted-foreground">
							{Object.values(result.address).join(', ')}
						</p>
					</div>
					<Button size="sm" onclick={() => onResultSelect(result, associatedPlace)}>
						{#if associatedPlace}
							See details
						{:else}
							Review
						{/if}
					</Button>
				</div>
			{/each}
		</div>
	{:else if open && searchResults && searchInput && searchInput.value?.length > 2}
		<p class="mx-auto text-sm">No results found.</p>
	{/if}
	{#if open}
		<div class="h-full" transition:slide={{ duration: 500 }}></div>
	{/if}
</div>
