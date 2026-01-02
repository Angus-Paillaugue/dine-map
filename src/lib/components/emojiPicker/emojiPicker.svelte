<script lang="ts">
	import { cn } from '$lib/utils';
	import type { SvelteHTMLElements } from 'svelte/elements';
	import { availableEmojisData } from '$lib/emoji';
	import { Button } from '../ui/button';
	import { fade } from 'svelte/transition';
	import type { AvailableEmojis } from '$lib/types';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { SearchIcon } from '@lucide/svelte';

	interface Props {
		onSelect?: (emoji: AvailableEmojis) => void;
		selectedEmoji?: string;
		open?: boolean;
		searchable?: boolean;
	}

	let {
		open = $bindable(false),
		onSelect,
		children,
		selectedEmoji,
		searchable = true,
		class: className,
		...restProps
	}: Props & SvelteHTMLElements['div'] = $props();
	let searchValue = $state('');
	let filteredEmojis = $derived(searchEmojis());

	function onWindowClick(event: MouseEvent) {
		if (!(event.target as HTMLElement).closest('.emoji-picker')) {
			open = false;
		}
	}

	function searchEmojis() {
		if (searchValue.length === 0) {
			return Object.keys(availableEmojisData);
		}
		return Object.entries(availableEmojisData)
			.filter(([, name]) => name.includes(searchValue.toLowerCase()))
			.map(([emoji]) => emoji);
	}
</script>

<svelte:window onclick={onWindowClick} />

<div class={cn('emoji-picker relative', className)} {...restProps}>
	<button
		onclick={() => {
			open = !open;
		}}
	>
		{@render children?.()}
	</button>
	{#if open}
		<div
			class="absolute top-full left-0 z-10 mt-2 flex h-[50dvh] max-h-60 w-[80dvw] max-w-60 flex-col gap-2 rounded border border-border bg-card p-2"
			transition:fade={{ duration: 200 }}
		>
			{#if searchable}
				<InputGroup.Root>
					<InputGroup.Input placeholder="Search" class="text-sm" bind:value={searchValue} />
					<InputGroup.Addon>
						<SearchIcon />
					</InputGroup.Addon>
				</InputGroup.Root>
			{/if}
			<div
				class="grid h-full overflow-y-auto"
				transition:fade={{ duration: 300 }}
				style="grid-template-columns: repeat(auto-fill, minmax(2.25rem, 1fr)); grid-auto-rows: 2.25rem;"
			>
				{#each filteredEmojis as emoji (emoji)}
					<Button
						onclick={() => {
							onSelect?.(emoji);
							open = false;
						}}
						size="icon"
						variant={emoji === selectedEmoji ? 'default' : 'ghost'}
						class="text-lg"
					>
						{emoji}
					</Button>
				{/each}
			</div>
		</div>
	{/if}
</div>
