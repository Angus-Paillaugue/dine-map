<script lang="ts">
	import Nav from './Nav.svelte';
	import Search from './Search.svelte';
	import Details from './Details.svelte';
	import ManageList from './ManageList.svelte';

	let { children } = $props();
</script>

<!-- Search input -->
<Search />

<!-- Restaurant details (CRUD) dialog -->
<Details />

<!-- Bookmark (list) manager -->
<ManageList />
<Nav />

<div class="relative h-full w-full overflow-hidden rounded bg-card/50 shadow">
	<div class="relative flex h-full w-full flex-col overflow-auto">
		{@render children?.()}
	</div>
</div>
