<script lang="ts">
	import type { Restaurant } from '$lib/types';
	import { Feature } from 'svelte-openlayers';
	import { tailwindColorToHex } from '$lib/utils';
	import { createCircleStyle } from 'svelte-openlayers/utils';
	import type { Geometry } from 'ol/geom';
	import type { Feature as OlFeature } from 'ol';

	interface Props {
		restaurant: Restaurant;
		feature?: OlFeature<Geometry> | null;
	}

	let { restaurant = $bindable(), feature = $bindable(null) }: Props = $props();

	const style = createCircleStyle({
		radius: 8,
		stroke: tailwindColorToHex('primary'),
		fill: tailwindColorToHex('background'),
		strokeWidth: 2
	});
</script>

<Feature.Point coordinates={restaurant.coordinates} bind:feature properties={restaurant} {style} />
