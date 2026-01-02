<script lang="ts">
	import {
		type Coordinates,
		type List,
		type NewRestaurant,
		type Restaurant as RestaurantType,
		type Viewbox
	} from '$lib/types';
	import { onMount } from 'svelte';
	import { Map as MapComponent, Layer } from 'svelte-openlayers';
	import Search from './Search.svelte';
	import { dev } from '$app/environment';
	import Globals from '$lib/globals.svelte';
	import Details from './Details.svelte';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { fromLonLat, toLonLat } from 'ol/proj';
	import ManageList from './ManageList.svelte';
	import VectorSource from 'ol/source/Vector';
	import Cluster from 'ol/source/Cluster';
	import OlFeature from 'ol/Feature';
	import Point from 'ol/geom/Point';
	import { clusterStyle } from '$lib/utils';
	import Toaster from '$lib/components/Toast';
	import OlMap from 'ol/Map';
	import TooltipManager from './TooltipManager.svelte';

	let restaurants = $derived<RestaurantType[]>(page.data.restaurants);
	let lists = $derived<List[]>(page.data.lists);
	let restaurantIdsInLists = $derived.by(() => {
		// This used to more efficiently filter restaurants on the map based on lists since it only updates when lists change
		const map = new Map<List['id'], Set<RestaurantType['id']>>();
		for (const list of lists) {
			map.set(list.id, new Set(list.restaurants.map((r) => r.id)));
		}
		return map;
	});
	let mapCenter = $state<Coordinates>([0, 0]);
	let map = $state<OlMap | null>(null);
	let viewBox = $state<Viewbox | null>(null);
	let tileServerStatus = $state<{
		status: string | null;
		retry: ReturnType<typeof setTimeout> | null;
	}>({
		status: null,
		retry: null
	});
	const BASE_MAP_URL = '/api/tile/{z}/{x}/{y}.png';
	$inspect(tileServerStatus);

	const updateViewBox = () => {
		if (!map) return;
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

	let restaurantSource = $derived.by(() => {
		let filteredRestaurants = [];
		if (Globals.mapFilterList.length > 0) {
			filteredRestaurants = restaurants.filter((r) =>
				Globals.mapFilterList.some((listId) => restaurantIdsInLists.get(listId)?.has(r.id))
			);
		} else {
			filteredRestaurants = restaurants;
		}
		return new VectorSource({
			features: filteredRestaurants.map(
				(r) =>
					new OlFeature({
						geometry: new Point(fromLonLat(r.coordinates)),
						restaurant: r
					})
			)
		});
	});

	let clusterSource = $state(
		new Cluster({
			distance: 50, // 50 px since each POI icon is 40x40 and there is the text on top of it, so to be safe, we say 50px
			// svelte-ignore state_referenced_locally
			source: restaurantSource
		})
	);

	// Apply it in an effect because in a derived, it does not reflect the changes on the rendered source
	$effect(() => {
		if (clusterSource && restaurantSource) clusterSource.setSource(restaurantSource);
	});

	function onMapClick(e: any) {
		if (!map) return;
		map.forEachFeatureAtPixel(e.pixel, function (feature: any) {
			const restaurants = feature.get('features');
			if (!restaurants || restaurants.length !== 1) return;
			const restaurant = restaurants[0].get('restaurant') as RestaurantType;
			Globals.restaurantDetailsId = restaurant.id;
		});
	}
</script>

<svelte:head>
	<title>Dine Map</title>
</svelte:head>

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
						Toaster.error('Error creating restaurant');
						console.error('Error creating restaurant:', error);
					});
			}
		}}
	/>
{/if}

<MapComponent.Root class="block h-96 w-full" bind:map onClick={onMapClick}>
	<MapComponent.View center={mapCenter} onMoveEnd={updateViewBox} maxZoom={22} zoom={14} />
	<!-- Map tiles -->
	<!-- ? The attribution text and styling are not default. I do not think that I break any rule listed by OpenStreetMap or Carto (see https://osmfoundation.org/wiki/Licence/Attribution_Guidelines#Attribution_text, https://osmfoundation.org/wiki/Licence/Attribution_Guidelines#Interactive_maps & https://github.com/CartoDB/basemap-styles?tab=readme-ov-file#1-web-raster-basemaps) but if you have any legal knowledge, please open a PR or discussion about it. -->
	<Layer.Tile
		source="xyz"
		url={BASE_MAP_URL}
		attributions="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
		zIndex={0}
	/>

	<!-- Restaurants dots -->
	<Layer.Vector bind:source={clusterSource} style={clusterStyle}></Layer.Vector>

	<!-- Restaurants tooltips -->
	<TooltipManager />
</MapComponent.Root>

<!-- Restaurant details (CRUD) modal -->
<Details />

<ManageList />
