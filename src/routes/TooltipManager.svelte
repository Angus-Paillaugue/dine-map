<script lang="ts">
	import type { Restaurant } from '$lib/types';
	import { Overlay } from 'svelte-openlayers';
	import { ChevronRight } from '@lucide/svelte';
	import Rating from './Rating.svelte';
	import { clusterStyle, cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import Globals from '$lib/globals.svelte';
</script>

<Overlay.TooltipManager
	hoverTooltip={true}
	selectTooltip={true}
	selectStyle={clusterStyle}
	hoverClass="!bg-transparent !shadow-none"
	selectClass="!bg-transparent !shadow-none"
>
	{#snippet hoverSnippet(feature)}
		{@const props = feature.getProperties()}
		{@const restaurants =
			'features' in props
				? props.features.map((e: any) => e.getProperties().restaurant as Restaurant)
				: []}
		{#if restaurants.length > 1}
			<div class="flex flex-row items-center rounded border border-border bg-card p-2 shadow">
				{#each restaurants.slice(0, 4) as { icon }, i}
					<div
						class={cn(
							'flex size-7 flex-col items-center justify-center rounded-full bg-background',
							i > 0 && '-ml-2'
						)}
					>
						<span class="font-mono text-lg font-bold">{icon}</span>
					</div>
				{/each}
				{#if restaurants.length > 4}
					<div
						class="-ml-2 flex size-7 flex-col items-center justify-center rounded-full bg-background"
					>
						<span class="font-mono text-sm font-bold">+{restaurants.length - 4}</span>
					</div>
				{/if}
			</div>
		{:else}
			<div
				class="flex flex-row items-center gap-4 rounded border border-border bg-card px-4 py-2 shadow"
			>
				<div class="font-mono text-base font-bold">{restaurants[0].icon} {restaurants[0].name}</div>
				<div class="h-fit rounded-full bg-secondary px-2">
					<Rating rating={restaurants[0].rating} compact={true} />
				</div>
			</div>
		{/if}
	{/snippet}

	{#snippet selectSnippet(feature)}
		{@const props = feature.getProperties()}
		{@const restaurants = (
			'features' in props ? props.features.map((e: any) => e.getProperties().restaurant) : []
		) as Restaurant[]}
		{#if restaurants.length > 1}
			<div
				class="max-h-[80dvh] w-[80dvw] max-w-125 space-y-4 overflow-y-auto rounded border border-border bg-card p-4"
			>
				{#each restaurants as { icon, name, id } (id)}
					<div class="flex flex-row items-center justify-between gap-2 rtl:flex-row-reverse">
						<p class="line-clamp-1 font-mono text-lg font-medium">{icon} {name}</p>
						<Button size="icon-sm" onclick={() => (Globals.restaurantDetailsId = id)}>
							<ChevronRight class="size-4 rtl:rotate-180" />
						</Button>
					</div>
				{/each}
			</div>
		{/if}
	{/snippet}
</Overlay.TooltipManager>
