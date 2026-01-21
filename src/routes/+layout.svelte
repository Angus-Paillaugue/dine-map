<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Toaster from '$lib/components/Toast';
	import type { LayoutProps } from './$types';
	import * as Tooltip from '$lib/components/ui/tooltip';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Toaster.Toaster />

<div class="flex h-dvh w-dvw flex-col">
	<div class="flex grow flex-col p-2">
		<Tooltip.Provider>
			{@render children?.()}
		</Tooltip.Provider>
	</div>
</div>
