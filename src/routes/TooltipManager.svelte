<script lang="ts">
	import type { Restaurant } from '$lib/types';
	import { Overlay } from 'svelte-openlayers';
	import { ChevronRight } from '@lucide/svelte';
	import { clusterStyle, cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import Globals from '$lib/globals.svelte';
</script>

<Overlay.TooltipManager
	selectTooltip={true}
	hoverTooltip={false}
	selectStyle={clusterStyle}
	selectClass="!bg-transparent !shadow-none"
>
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
