<script lang="ts">
	import { type Coordinates, type Restaurant as RestaurantType } from '$lib/types';
	import { Layer, Feature } from 'svelte-openlayers';
	import { toLonLat } from 'ol/proj';
	import { formatDistance, formatDuration, portal, tailwindVarValue } from '$lib/utils';
	import OlMap from 'ol/Map';
	import { onMount } from 'svelte';
	import Geolocation from 'ol/Geolocation';
	import { createIconStyle, createStyle } from 'svelte-openlayers/utils';
	import { dev } from '$app/environment';
	import Toaster from '$lib/components/Toast';
	import Globals from '$lib/globals.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Bike, Car, Footprints, X } from '@lucide/svelte';
	import { Spinner } from '$lib/components/ui/spinner';
	import { slide } from 'svelte/transition';
	import * as Select from '$lib/components/ui/select';

	interface Props {
		map: OlMap | null;
	}
	const transportModes = ['foot', 'bike', 'car'] as const;
	type TransportModes = (typeof transportModes)[number];

	let { map = $bindable(null) }: Props = $props();
	let transportMode = $state<TransportModes>('foot');
	let routing = $state<{
		path: Coordinates[] | null;
		duration: number | null;
		distance: number | null;
	}>({
		path: null,
		duration: null,
		distance: null
	});
	let activePOI = $state<RestaurantType | null>(null);
	let userPosition = $state<{
		coordinates: Coordinates | null;
		available: boolean;
		heading: number | null;
	}>({
		coordinates: null,
		available: true,
		heading: null
	});

	function createPositionIconElement() {
		const size = 24;
		const color = tailwindVarValue('foreground');
		const arrow = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon transform="rotate(${((userPosition.heading || 0) * 180) / Math.PI} ${size / 2} ${size / 2})" points="12 2 19 21 12 17 5 21 12 2"/></svg>`;
		const point = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`;

		const icon = userPosition.heading !== null ? arrow : point;
		const style = createIconStyle({
			src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(icon)}`,
			scale: 1,
			anchor: [0.5, 0.5],
			anchorXUnits: 'fraction',
			anchorYUnits: 'fraction'
		});
		return style;
	}

	onMount(() => {
		let keyDownListener = (e: KeyboardEvent) => {
			if (!userPosition.coordinates) return;
			const step = 0.0005;
			switch (e.key) {
				case 'w':
					userPosition.coordinates = [
						userPosition.coordinates[0],
						userPosition.coordinates[1] + step
					];
					break;
				case 's':
					userPosition.coordinates = [
						userPosition.coordinates[0],
						userPosition.coordinates[1] - step
					];
					break;
				case 'a':
					userPosition.coordinates = [
						userPosition.coordinates[0] - step,
						userPosition.coordinates[1]
					];
					break;
				case 'd':
					userPosition.coordinates = [
						userPosition.coordinates[0] + step,
						userPosition.coordinates[1]
					];
					break;
				case 'q':
					userPosition.heading = ((userPosition.heading || 0) - Math.PI / 18) % (2 * Math.PI);
					break;
				case 'e':
					userPosition.heading = ((userPosition.heading || 0) + Math.PI / 18) % (2 * Math.PI);
					break;
			}
		};
		if (dev) {
			console.debug('Dev mode: Simulated user position set.');
			userPosition.coordinates = [1.4780642, 43.5433141];
			userPosition.heading = Math.PI / 2; // 90 degrees
			userPosition.available = true;
			// Make some keyboard controls to simulate movement
			window.addEventListener('keydown', keyDownListener);
		} else if (map) {
			const geolocation = new Geolocation({
				tracking: true,
				projection: map.getView().getProjection(),
				trackingOptions: {
					enableHighAccuracy: true
				}
			});

			geolocation.on('change:position', () => {
				const position = geolocation.getPosition();
				const heading = geolocation.getHeading();
				if (position) {
					userPosition.coordinates = toLonLat(position) as Coordinates;
					userPosition.heading = heading || null;
					userPosition.available = true;
				} else {
					userPosition.available = false;
					userPosition.coordinates = null;
					userPosition.heading = null;
				}
			});

			geolocation.on('error', (error) => {
				console.error(error);
			});
		}

		return () => {
			if (dev) {
				window.removeEventListener('keydown', keyDownListener);
			}
		};
	});

	async function getRouting(end: Coordinates) {
		if (!userPosition.available || !userPosition.coordinates) {
			throw new Error('User position not available');
		}
		const start = userPosition.coordinates;
		const coords = [start, end].join(';');
		const response = await fetch(
			`https://routing.openstreetmap.de/routed-${transportMode}/route/v1/driving/${coords}?overview=false&geometries=polyline&steps=true`
		);
		if (!response.ok) {
			throw new Error('Failed to get routing data');
		}
		const data = await response.json();

		return data;
	}

	export async function showRouteToPoi(poi?: RestaurantType) {
		if (!poi && activePOI) {
			poi = activePOI;
		}
		if (!poi) {
			throw new Error('Destination coordinates not provided');
		}
		activePOI = poi;
		routing.path = null;
		routing.distance = null;
		routing.duration = null;
		try {
			const data = await getRouting(poi.coordinates);
			if (data.routes && data.routes.length > 0) {
				const route = data.routes[0];
				const coordinates = route.legs.flatMap((leg: any) =>
					leg.steps.map((step: any) => step.maneuver.location)
				);
				routing.path = coordinates;
				routing.distance = route.distance;
				routing.duration = route.duration;
			} else {
				routing.path = null;
				activePOI = null;
			}
		} catch (error) {
			Toaster.error('Error calculating route');
			console.error('Error calculating route:', error);
			routing.path = null;
			activePOI = null;
		}
	}
	Globals.showRouteToPoi = showRouteToPoi;

	const exitNavigation = () => {
		activePOI = null;
		routing.path = null;
	};

	function getCurrentUserPosition() {
		return userPosition.coordinates || [0, 0];
	}
	Globals.getCurrentUserPosition = getCurrentUserPosition;
</script>

{#snippet transportModeIcon(mode: TransportModes)}
	{#if mode === 'car'}
		<Car />
	{:else if mode === 'bike'}
		<Bike />
	{:else if mode === 'foot'}
		<Footprints />
	{/if}
{/snippet}

<Layer.Vector>
	{#if routing.path}
		<Feature.LineString
			coordinates={routing.path}
			style={createStyle({
				stroke: {
					color: tailwindVarValue('foreground'),
					width: 3
				}
			})}
		/>
	{/if}
	{#if userPosition.available && userPosition.coordinates}
		<Feature.Point
			bind:coordinates={userPosition.coordinates}
			properties={{ name: 'UserLocation' }}
			style={createPositionIconElement()}
		/>
	{/if}
</Layer.Vector>

{#if activePOI}
	<div
		class="fixed right-4 bottom-4 left-4 z-25 flex flex-col gap-4 rounded border border-border bg-card p-4 shadow"
		use:portal
		transition:slide={{ axis: 'y' }}
	>
		{#if !routing.path}
			<div class="flex flex-col items-center justify-center gap-2">
				<Spinner class="size-6" />
				<p class="line-clamp-1">
					Calculating itinerary to <strong>{activePOI.name}</strong>...
				</p>
			</div>
		{:else}
			<div class="flex w-full flex-row items-center justify-between gap-4">
				<h1 class="line-clamp-1 text-xl font-medium">Navigating to {activePOI.name}</h1>
				<Button
					variant="secondary"
					size="icon-sm"
					onclick={exitNavigation}
					aria-label="Exit navigation"
				>
					<X class="size-4" />
				</Button>
			</div>

			<div class="flex flex-row gap-2">
				<span class="rounded-full bg-secondary px-2 py-1 font-mono text-sm">
					{#if routing.distance}
						{formatDistance(routing.distance)}
					{:else}
						-- km
					{/if}
				</span>
				<span class="rounded-full bg-secondary px-2 py-1 font-mono text-sm">
					{#if routing.duration}
						{formatDuration(routing.duration)}
					{:else}
						-- min
					{/if}
				</span>
			</div>

			<Select.Root
				type="single"
				bind:value={transportMode}
				onValueChange={() => {
					showRouteToPoi();
				}}
			>
				<Select.Trigger class="w-fit capitalize">
					<div class="flex flex-row items-center gap-2">
						{@render transportModeIcon(transportMode)}
						{transportMode}
					</div>
				</Select.Trigger>
				<Select.Content>
					{#each transportModes as mode (mode)}
						<Select.Item class="capitalize" value={mode}>
							{@render transportModeIcon(mode)}
							{mode}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		{/if}
	</div>
{/if}
