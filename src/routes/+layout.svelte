<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Globals from '$lib/globals.svelte';
	import { SearchIcon, X } from '@lucide/svelte';
	import { cn } from '$lib/utils';
	import { scale } from 'svelte/transition';

	let { children } = $props();

	function onWindowKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && Globals.searchOpen) {
			Globals.searchOpen = false;
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<svelte:window onkeydown={onWindowKeydown} />

<div class="flex h-dvh w-dvw flex-col">
	<div class="grow p-2">
		<div class="h-full w-full overflow-hidden rounded shadow relative">
			<div class="relative h-full w-full overflow-auto">
				{@render children()}
			</div>
			<button
				class={cn(
					'absolute right-2 bottom-2 z-20 size-10 rounded-full p-2 transition-all',
					Globals.searchOpen ? 'bg-secondary' : 'bg-secondary/50 backdrop-blur-xs'
				)}
				onclick={() => (Globals.searchOpen = !Globals.searchOpen)}
			>
				{#if Globals.searchOpen}
					<div class="size-full" in:scale={{ duration: 200 }}>
						<X class="size-full" />
					</div>
				{:else}
					<div class="size-full" in:scale={{ duration: 200 }}>
						<SearchIcon class="size-full" />
					</div>
				{/if}
			</button>
		</div>
	</div>
</div>
