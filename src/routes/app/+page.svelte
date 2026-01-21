<script lang="ts">
	import { type List, type Restaurant as RestaurantType } from '$lib/types';
	import { Map as MapComponent, Layer } from 'svelte-openlayers';
	import Globals from '$lib/globals.svelte';
	import { page } from '$app/state';
	import { fromLonLat, toLonLat } from 'ol/proj';
	import VectorSource from 'ol/source/Vector';
	import Cluster from 'ol/source/Cluster';
	import OlFeature from 'ol/Feature';
	import Point from 'ol/geom/Point';
	import { clusterStyle } from '$lib/utils';
	import type OlMap from 'ol/Map';
	import TooltipManager from './TooltipManager.svelte';
	import { onMount, tick } from 'svelte';
	import Navigation from './Navigation.svelte';
	import QuickActions from '$lib/components/QuickActions/QuickActions.svelte';
	import { SvelteMap } from 'svelte/reactivity';

	let restaurants = $derived<RestaurantType[]>(page.data.restaurants);
	let lists = $derived<List[]>(page.data.lists);
	let restaurantIdsInLists = $derived.by(() => {
		// This used to more efficiently filter restaurants on the map based on lists since it only updates when lists change
		const map = new SvelteMap<List['id'], Set<RestaurantType['id']>>();
		for (const list of lists) {
			map.set(list.id, new Set(list.restaurants.map((r) => r.id)));
		}
		return map;
	});
	let map = $state<OlMap | null>(null);
	const BASE_MAP_URL = '/api/tile/{z}/{x}/{y}.png';

	const updateViewBox = () => {
		if (!map) return;
		const size = map.getSize();
		if (!size) return;
		const extent = map.getView().calculateExtent(size);
		const [minLon, minLat] = toLonLat([extent[0], extent[1]]);
		const [maxLon, maxLat] = toLonLat([extent[2], extent[3]]);
		Globals.viewBox = [minLon, minLat, maxLon, maxLat];
	};

	let restaurantSource = $derived.by(() => {
		let filteredRestaurants = [];
		if (Globals.mapFilterList.length > 0) {
			filteredRestaurants = restaurants.filter((r) =>
				Globals.mapFilterList.some((listId) => restaurantIdsInLists.get(listId)?.has(r.id))
			);
		} else if (Globals.mapFilterRestaurant.length > 0) {
			filteredRestaurants = restaurants.filter((r) => Globals.mapFilterRestaurant.includes(r.id));
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
			distance: 50 // 50 px since each POI icon is 40x40 and there is the text on top of it, so to be safe, we say 50px
		})
	);

	function focusOnCurrentSource(maxZoom: number = 19) {
		if (!map || !restaurantSource) return;
		const extent = restaurantSource.getExtent();
		if (extent.every(Number.isFinite)) {
			map.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 500, maxZoom });
		} else {
			// Focus on user location if no restaurants are visible
			const userLocation = Globals.getCurrentUserPosition();
			if (userLocation) {
				map.getView().animate({
					center: fromLonLat(userLocation),
					zoom: 14,
					duration: 500
				});
			}
		}
	}

	async function resetMapView() {
		await tick();
		focusOnCurrentSource();
	}

	// Apply source in an effect because in a derived, it does not reflect the changes on the rendered source
	$effect(() => {
		if (clusterSource && restaurantSource) {
			clusterSource.setSource(restaurantSource);
		}
	});

	onMount(() => {
		resetMapView();
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

	Globals.resetMapView = resetMapView;
</script>

<svelte:head>
	<title>Dine Map</title>
</svelte:head>

<MapComponent.Root class="block h-96 w-full" bind:map onClick={onMapClick} zoomControl={false}>
	<MapComponent.View onMoveEnd={updateViewBox} maxZoom={22} zoom={14} enableRotation={false} />

	<!-- Map tiles -->
	<Layer.Tile source="xyz" url={BASE_MAP_URL} zIndex={0} />

	<!-- Restaurants dots -->
	<Layer.Vector bind:source={clusterSource} style={clusterStyle}></Layer.Vector>
	<Navigation bind:map />

	<!-- Restaurants tooltips -->
	<TooltipManager />
</MapComponent.Root>

<!-- Top bar (pill buttons) -->
<QuickActions />
