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
	import type { Restaurant, Coordinates, Viewbox } from '$lib/types';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { Spinner } from '$lib/components/ui/spinner';
	import { SearchIcon } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { page } from '$app/state';
	import { isSamePlace } from '$lib/utils';
	import { fade, fly } from 'svelte/transition';

	interface Props {
		viewBox: Viewbox;
		open: boolean;
		onResultSelect?: (result: SearchResult, associatedPlace?: Restaurant) => void;
	}

	let {
		open = $bindable(),
		viewBox = $bindable(),
		onResultSelect
	}: Props = $props();
	let searchInput = $state<HTMLInputElement | null>(null);
	let restaurants = $derived<Restaurant[]>(page.data.restaurants);
	let searchResults = $state<SearchResult[]>([]);
	let abortController = $state<AbortController | null>(null);
	let loading = $state(false);

	// Search places within the current viewbox
	async function search(query: string) {
		if (!viewBox) return [];
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
			console.error('Search error:', error);
			return [];
		}
	}

	function onSearchInputKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			if (abortController) {
				abortController.abort();
			}
			abortController = new AbortController();
			loading = true;
			search(searchInput?.value || '').then((results) => {
				searchResults = results;
				loading = false;
			});
		}
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
</script>

{#if open}
	<div
		class="absolute inset-0 z-10 flex flex-col items-center justify-end bg-background/50 backdrop-blur-xs"
		transition:fade={{ duration: 200 }}
	></div>
	<div
		class="fixed top-4 right-4 left-4 z-10 flex flex-col gap-4"
		transition:fly={{ duration: 300, y: '-100%' }}
	>
		<InputGroup.Root class="bg-card">
			<InputGroup.Input
				placeholder="Search for restaurants"
				bind:ref={searchInput}
				onkeydown={onSearchInputKeydown}
			/>
			<InputGroup.Addon align="inline-end">
				<InputGroup.Button size="icon-xs">
					<SearchIcon /></InputGroup.Button
				>
			</InputGroup.Addon>
		</InputGroup.Root>
		{#if loading}
			<Spinner class="mx-auto" />
		{:else if searchResults.length > 0}
			<div class="flex flex-col gap-2">
				{#each searchResults as result}
					{@const associatedPlace = restaurants.find((rest) =>
						isSamePlace(rest.coordinates, result.coordinates)
					)}
					<div
						class="flex w-full flex-row items-center justify-between gap-2 rounded border border-border bg-card p-4"
					>
						<div class="flex flex-col gap-1">
							<p class="text-base font-medium">
								{result.name || 'Unnamed Place'}
							</p>
							<p class="line-clamp-1 text-sm font-light text-muted-foreground">
								{Object.values(result.address).join(', ')}
							</p>
						</div>
						<Button size="sm" onclick={() => onResultSelect?.(result, associatedPlace)}>
							{#if associatedPlace}
								See details
							{:else}
								Review
							{/if}
						</Button>
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-muted-foreground">No results found.</p>
		{/if}
	</div>
{/if}
