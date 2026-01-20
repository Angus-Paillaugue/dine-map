<script lang="ts">
	import { cn, type WithElementRef, type WithoutChildren } from '$lib/utils';
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		'data-slot': dataSlot = 'textarea',
		autoFit = { active: false, maxRows: 10, minRows: 2 },
		rows = 2,
		oninput,
		...restProps
	}: WithoutChildren<WithElementRef<HTMLTextareaAttributes, HTMLTextAreaElement>> & {
		autoFit?: { active: boolean; maxRows?: number; minRows?: number };
	} = $props();

	function resizeTextarea() {
		if (!autoFit.active || !ref) return;
		const { minRows = 2, maxRows = 10 } = autoFit;
		ref.rows = minRows;
		ref.style.height = 'auto';
		const lineHeight = parseFloat(getComputedStyle(ref).lineHeight || '20');
		const scrollRows = Math.floor(ref.scrollHeight / lineHeight);
		const rowsToSet = Math.max(minRows, Math.min(scrollRows, maxRows));
		ref.rows = rowsToSet;
	}

	function handleInput(e: Event & { currentTarget: EventTarget & HTMLTextAreaElement }) {
		resizeTextarea();
		oninput?.(e);
	}

	$effect(() => {
		if (ref) ref = ref;
		resizeTextarea();
	});
</script>

<textarea
	bind:this={ref}
	data-slot={dataSlot}
	class={cn(
		'flex field-sizing-content w-full rounded-md border border-input bg-input/30 px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/40 md:text-sm',
		className
	)}
	rows={autoFit.active ? (autoFit.minRows ?? 2) : rows}
	bind:value
	oninput={handleInput}
	{...restProps}
></textarea>
