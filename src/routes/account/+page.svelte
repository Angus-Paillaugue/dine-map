<script lang="ts">
	import { page } from '$app/state';
	import type { Restaurant } from '$lib/types';
	import Contributions from './Contributions.svelte';

	let restaurants = $derived(page.data.restaurants as Restaurant[]);
</script>

<div class="mx-auto w-full max-w-250">
	<Contributions />
</div>
