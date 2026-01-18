<script lang="ts">
	import { MapCtxKey, type List, type MapCtx, type Restaurant as RestaurantType } from '$lib/types';
	import { Map as MapComponent, Layer } from 'svelte-openlayers';
	import Globals from '$lib/globals.svelte';
	import Details from './Details.svelte';
	import { page } from '$app/state';
	import { fromLonLat, toLonLat } from 'ol/proj';
	import ManageList from './ManageList.svelte';
	import VectorSource from 'ol/source/Vector';
	import Cluster from 'ol/source/Cluster';
	import OlFeature from 'ol/Feature';
	import Point from 'ol/geom/Point';
	import { clusterStyle } from '$lib/utils';
	import type OlMap from 'ol/Map';
	import TooltipManager from './TooltipManager.svelte';
	import Search from './Search.svelte';
	import { onMount, tick } from 'svelte';
	import { setContext } from 'svelte';
	import Navigation from './Navigation.svelte';
	import { scale } from 'svelte/transition';
	import { Bookmark, X } from '@lucide/svelte';
	import QuickActions from './QuickActions.svelte';

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
		}
	}

	async function resetMapView() {
		await tick();
		focusOnCurrentSource();
	}

	function getMap() {
		return map;
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

	setContext(MapCtxKey, { resetMapView, getMap } as MapCtx);
</script>

<svelte:head>
	<title>Dine Map</title>
</svelte:head>

<MapComponent.Root class="block h-96 w-full" bind:map onClick={onMapClick} zoomControl={false}>
	<MapComponent.View onMoveEnd={updateViewBox} maxZoom={22} zoom={14} enableRotation={false} />
	<!-- Map tiles -->
	<!-- ? The attribution text and styling are not default. I do not think that I break any rule listed by OpenStreetMap (see https://osmfoundation.org/wiki/Licence/Attribution_Guidelines#Attribution_text, https://osmfoundation.org/wiki/Licence/Attribution_Guidelines#Interactive_maps) but if you have any legal knowledge, please open a PR or discussion about it. -->
	<Layer.Tile
		source="xyz"
		url={BASE_MAP_URL}
		attributions="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
		zIndex={0}
	/>

	<!-- Restaurants dots -->
	<Layer.Vector bind:source={clusterSource} style={clusterStyle}></Layer.Vector>
	<Navigation bind:map />

	<!-- Restaurants tooltips -->
	<TooltipManager />
</MapComponent.Root>

<!-- Search input -->
<Search />

<!-- Restaurant details (CRUD) dialog -->
<Details />

<!-- Bookmark (list) manager -->
<ManageList />

<!-- Top bar (pill buttons & manage bookmarks) -->
<div class="absolute top-2 right-2 left-0 z-10 flex flex-row items-center">
	<QuickActions />
	<button
		aria-label="Manage your saved lists"
		class="shrink-0"
		onclick={() => {
			if (Globals.mapFilterList.length > 0) {
				Globals.mapFilterList = [];
				resetMapView();
			} else {
				Globals.manageLists = !Globals.manageLists;
			}
		}}
	>
		<div class="relative size-10 p-2.5 text-foreground">
			<svg
				version="1.1"
				xmlns="http://www.w3.org/2000/svg"
				xmlns:xlink="http://www.w3.org/1999/xlink"
				x="0px"
				y="0px"
				width="100%"
				viewBox="0 0 90 90"
				enable-background="new 0 0 90 90"
				xml:space="preserve"
				class="absolute inset-0 -z-10 text-secondary"
				><path
					fill="currentColor"
					opacity="1"
					stroke="none"
					d="M42.3 5c-2.784-.8339-5.2273-1.427-7.516-2.3882C24.1225-1.8657 14.1606-.5302 7.047 6.735-.762 14.7105-1.6695 24.0876 2.6313 33.9506c3.203 7.3454 3.2792 14.2704.0952 21.6659-4.5933 10.669-2.8243 20.5927 4.6069 27.6086 8.0742 7.623 17.3897 8.5081 27.2756 4.0417 7.1468-3.2289 14.0366-3.0809 21.2053.0556 10.5577 4.6194 19.9433 3.0062 27.1979-4.1975 7.5443-7.4914 9.1175-16.4868 4.4276-27.558-3.0368-7.1689-3.1289-14.0642.03-21.2335 4.7029-10.6735 3.0314-20.1477-4.4543-27.5759C75.707-.4949 65.9256-1.9883 55.2899 2.6308 51.2565 4.3825 47.1601 5.5714 42.3 5Z"
				/></svg
			>
			{#if Globals.mapFilterList.length > 0}
				<div class="z-10 size-full" in:scale={{ duration: 200 }}>
					<div class="size-full">
						<X class="size-full" />
					</div>
				</div>
			{:else}
				<div class="z-10 size-full" in:scale={{ duration: 200 }}>
					<div class="size-full">
						<Bookmark class="size-full" />
					</div>
				</div>
			{/if}
		</div>
	</button>
</div>
