<script module lang="ts">
	import { DIETARY_INFO_DISPLAY, formatDistance } from '$lib/utils';
	import { DicesIcon, PinIcon } from '@lucide/svelte';

	export { halal, vegetarian, random, notHalal, pillIcon };
</script>

{#snippet pillIcon(name: string)}
	<div class="relative size-4">
		{#if name === 'near-me'}
			<PinIcon class="size-full" />
		{:else if name === 'random'}
			<DicesIcon class="size-full" />
		{:else if name === 'halal'}
			<DIETARY_INFO_DISPLAY.halal.icon class="size-full" />
		{:else if name === 'vegetarian'}
			<DIETARY_INFO_DISPLAY.vegetarian.icon class="size-full" />
		{:else if name === 'not-halal'}
			{@render notHalal()}
		{/if}
	</div>
{/snippet}

{#snippet halal()}
	<DIETARY_INFO_DISPLAY.halal.icon
		class="size-5"
		style="color: {DIETARY_INFO_DISPLAY.halal.color};"
	/>
{/snippet}

{#snippet vegetarian()}
	<DIETARY_INFO_DISPLAY.vegetarian.icon
		class="size-5"
		style="color: {DIETARY_INFO_DISPLAY.vegetarian.color};"
	/>
{/snippet}

{#snippet random(distance: number)}
	<span class="text-sm text-muted-foreground">{formatDistance(distance)}</span>
{/snippet}

{#snippet notHalal()}
	<div
		class="relative size-4"
		style="--icon-color: var(--text-color, {DIETARY_INFO_DISPLAY.halal
			.color}); color: var(--icon-color);"
	>
		<div
			class="absolute top-1/2 left-1/2 h-0.5 w-[120%] -translate-x-1/2 -translate-y-1/2 rotate-45"
			style="background-color: var(--icon-color);"
		></div>
		<DIETARY_INFO_DISPLAY.halal.icon class="size-full" />
	</div>
{/snippet}
