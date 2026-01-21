<script lang="ts">
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils';
	import { Button } from '../button';
	import { scale } from 'svelte/transition';
	import { EyeClosedIcon, EyeIcon } from '@lucide/svelte';

	type InputType = Exclude<HTMLInputTypeAttribute, 'file'>;

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, 'type'> &
			({ type: 'file'; files?: FileList } | { type?: InputType; files?: undefined })
	> & {
		onDebounced?: (value: string) => void;
		debounceDelay?: number;
		oninput?: (event: Event) => void;
	};

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		files = $bindable(),
		class: className,
		onDebounced,
		oninput,
		debounceDelay = 300,
		'data-slot': dataSlot = 'input',
		...restProps
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	let innerType = $state(type ?? 'text');

	function debounce(func: (v: string) => void, delay: number) {
		let timeoutId: ReturnType<typeof setTimeout>;

		return function (v: string) {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => func(v), delay);
		};
	}

	const update = $derived(debounce((v: string) => onDebounced?.(v), debounceDelay));

	function onInput(event: Event) {
		update(value);
		oninput?.(event);
	}
</script>

{#if type === 'file'}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			'flex h-9 w-full min-w-0 rounded-md border border-input bg-input/30 px-3 pt-1.5 text-sm font-medium shadow-xs ring-offset-background transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
			'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
			'aria-invalid:border-destructive aria-invalid:ring-destructive/40',
			className
		)}
		type="file"
		bind:files
		bind:value
		{...restProps}
	/>
{:else if type === 'password'}
	<div class="relative">
		<input
			bind:this={ref}
			data-slot={dataSlot}
			class={cn(
				'flex h-9 w-full min-w-0 rounded-md border border-input bg-input/30 px-3 py-1 text-base shadow-xs ring-offset-background transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
				'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
				'aria-invalid:border-destructive aria-invalid:ring-destructive/40',
				className
			)}
			oninput={onInput}
			type={innerType}
			bind:value
			{...restProps}
		/>
		<Button
			size="icon"
			variant="ghost"
			type="button"
			class="roundeed-sm absolute top-1.5 right-1.5 size-6 p-1"
			onclick={() => {
				innerType = innerType === 'password' ? 'text' : 'password';
			}}
			aria-label={innerType === 'password' ? 'Show password' : 'Hide password'}
		>
			{#if innerType === 'password'}
				<span class="size-4" in:scale={{ duration: 200 }}>
					<EyeIcon class="size-full" />
				</span>
			{:else}
				<span class="size-4" in:scale={{ duration: 200 }}>
					<EyeClosedIcon class="size-full" />
				</span>
			{/if}
		</Button>
	</div>
{:else}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			'flex h-9 w-full min-w-0 rounded-md border border-input bg-input/30 px-3 py-1 text-base shadow-xs ring-offset-background transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
			'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
			'aria-invalid:border-destructive aria-invalid:ring-destructive/40',
			className
		)}
		oninput={onInput}
		{type}
		bind:value
		{...restProps}
	/>
{/if}
