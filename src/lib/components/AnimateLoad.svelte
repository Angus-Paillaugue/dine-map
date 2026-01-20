<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import type { SvelteHTMLElements } from 'svelte/elements';

	interface Props {
		delay?: number;
		stagger?: number;
		duration?: number;
	}

	let {
		delay = 50,
		stagger = 200,
		duration = 300,
		children,
		class: className,
		...restProps
	}: Props & SvelteHTMLElements['div'] = $props();

	let containerNode: HTMLElement | null = $state(null);

	$effect(() => {
		page.route;
		applyAnimationDelays();
	});

	function applyAnimationDelays() {
		if (containerNode) {
			const childNodes = Array.from(containerNode.children);
			childNodes.forEach((child, index) => {
				// Skip comment nodes and text nodes
				if (child.nodeType === 1) {
					const itemDelay = delay + index * stagger;
					(child as HTMLElement).style.setProperty('animation-delay', `${itemDelay}ms`);
					(child as HTMLElement).style.setProperty('animation-duration', `${duration}ms`);
				}
			});
		}
	}
</script>

<div class={cn('animate-in-wrapper', className)} bind:this={containerNode} {...restProps}>
	{@render children?.()}
</div>

<style>
	:global(.animate-in-wrapper > *:not(.no-fade)) {
		opacity: 0;
		animation: animateIn var(--animation-duration, 300ms) ease-out forwards;
		animation-delay: calc(var(--animation-delay, 0ms) + 0.1s);
		will-change: scale, opacity, transform;
	}

	@keyframes -global-animateIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
