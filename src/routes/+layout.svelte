<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Toaster from '$lib/components/Toast';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Toaster.Toaster />

<div class="flex h-dvh w-dvw flex-col">
	<div class="grow p-2">
		<div class="relative h-full w-full overflow-hidden rounded bg-card/50 shadow">
			<div class="relative h-full w-full overflow-auto">
				{@render children()}
			</div>
		</div>
	</div>
</div>
