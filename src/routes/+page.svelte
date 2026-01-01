<script lang="ts">
	import type {
		Coordinates,
		NewRestaurant,
		Restaurant as RestaurantType,
		Viewbox
	} from '$lib/types';
	import { onMount } from 'svelte';
	import { Map, Layer } from 'svelte-openlayers';
	import Restaurant from './Restaurant.svelte';
	import TooltipManager from './TooltipManager.svelte';
	import Search from './Search.svelte';
	import { dev } from '$app/environment';
	import Globals from '$lib/globals.svelte';
	import Details from './Details.svelte';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { toLonLat } from 'ol/proj';

	let restaurants = $derived(page.data.restaurants);
	let mapCenter = $state<Coordinates>([0, 0]);
	let map = $state<any>(null);
	let viewBox = $state<Viewbox | null>(null);
	const BASE_MAP_URL = '/api/tile/{z}/{x}/{y}.png';

	const updateViewBox = () => {
		const size = map.getSize();
		if (!size) return;
		const extent = map.getView().calculateExtent(size);
		const [minLon, minLat] = toLonLat([extent[0], extent[1]]);
		const [maxLon, maxLat] = toLonLat([extent[2], extent[3]]);
		viewBox = [minLon, minLat, maxLon, maxLat];
	};

	async function getUserLocation(): Promise<Coordinates | null> {
		if (navigator.geolocation) {
			return new Promise((resolve) => {
				navigator.geolocation.getCurrentPosition(
					(position) => {
						const coords: Coordinates = [position.coords.longitude, position.coords.latitude];
						resolve(coords);
					},
					(error) => {
						console.error('Error getting location:', error);
						resolve(null);
					}
				);
			});
		} else {
			console.error('Geolocation is not supported by this browser.');
			return null;
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

		const newRestaurant: RestaurantType = await response.json();
		return newRestaurant;
	}

	onMount(() => {
		// This has been done because Firefox thinks I am in Paris when I am not
		if (dev) {
			mapCenter = restaurants[0]?.coordinates || [0, 0];
		} else {
			getUserLocation().then((coords) => {
				if (coords) {
					mapCenter = coords;
				}
			});
		}
	});
</script>

{#if viewBox}
	<Search
		bind:viewBox
		bind:open={Globals.searchOpen}
		onResultSelect={(searchResult, associatedPlace) => {
			Globals.searchOpen = false;
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
						console.error('Error creating restaurant:', error);
					});
			}
		}}
	/>
{/if}

<Map.Root class="block h-96 w-full" bind:map>
	<Map.View center={mapCenter} onMoveEnd={updateViewBox} maxZoom={22} zoom={14} />
	<!-- Map tiles -->
	<!-- ? The attribution text and styling are not default. I do not think that I break any rule listed by OpenStreetMap or Carto (see https://osmfoundation.org/wiki/Licence/Attribution_Guidelines#Attribution_text, https://osmfoundation.org/wiki/Licence/Attribution_Guidelines#Interactive_maps & https://github.com/CartoDB/basemap-styles?tab=readme-ov-file#1-web-raster-basemaps) but if you have any legal knowledge, please open a PR or discussion about it. -->
	<Layer.Tile
		source="xyz"
		url={BASE_MAP_URL}
		attributions={`&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors${page.data.TILE_CUSTOM ? '' : " & <a href='https://carto.com/'>CARTO</a>"}`}
		zIndex={0}
	/>

	<!-- Restaurants dots -->
	<Layer.Vector>
		{#each restaurants as restaurant}
			<Restaurant {restaurant} />
		{/each}
	</Layer.Vector>

	<!-- Restaurants tooltips -->
	<TooltipManager />
</Map.Root>

<!-- Restaurant details (CRUD) modal -->
<Details />
