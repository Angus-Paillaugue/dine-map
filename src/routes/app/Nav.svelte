<script lang="ts">
	import Globals from '$lib/globals.svelte';
	import { cn } from '$lib/utils';
	import { BadgeQuestionMark, Bookmark, Home, Search, User, X } from '@lucide/svelte';
	import { fade, scale, slide } from 'svelte/transition';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';

	let aboutOpen = $state(false);
</script>

<svelte:head>
	<script async defer src="https://buttons.github.io/buttons.js"></script>
</svelte:head>

<!-- hidden defs for mask -->
<svg
	width="0"
	height="0"
	aria-hidden="true"
	style="position:absolute;pointer-events:none;opacity:0"
>
	<defs>
		<mask id="nav-shape-mask" maskUnits="userSpaceOnUse" width="44" height="44">
			<path
				fill="white"
				d="M18.76 2.2175c2.1554.2528 3.9738-.275 5.7611-1.0511C29.24-.8826 33.5774-.2173 36.8282 2.9981c3.3174 3.2952 4.058 7.4996 1.9736 12.2317-1.4015 3.1799-1.3615 6.2356-.0133 9.4155 2.08 4.9095 1.3793 8.901-1.9647 12.2229-3.2198 3.1976-7.3798 3.9117-12.0632 1.8627-3.1799-1.3926-6.2356-1.4591-9.4066-.0266-4.3862 1.9824-8.5196 1.5877-12.0987-1.7917-3.2952-3.1134-4.0802-7.5129-2.0445-12.245 1.4103-3.2819 1.3749-6.3509-.0443-9.6106C-.7406 10.6839-.3371 6.5239 3.1267 2.9848 6.28-.2351 10.6972-.8293 15.4249 1.1575c1.0156.4258 2.1022.6919 3.3351 1.06Z"
			/>
		</mask>
	</defs>
</svg>

{#snippet backgroundShape(className?: string)}
	<div class={cn('absolute inset-0 -z-10', className)} style="pointer-events: none;">
		<!-- masked blurred fill (only inside the shape) -->
		<div
			class="absolute inset-0 bg-input/50 backdrop-blur-sm"
			style="
        mask: url(#nav-shape-mask) no-repeat center / contain;
        -webkit-mask: url(#nav-shape-mask) no-repeat center / contain;
        mask-repeat: no-repeat;
        -webkit-mask-repeat: no-repeat;
        mask-position: center;
        -webkit-mask-position: center;
      "
		></div>

		<!-- shape stroke / visible outline -->
		<svg
			version="1.1"
			xmlns="http://www.w3.org/2000/svg"
			x="0px"
			y="0px"
			viewBox="0 0 40 40"
			xml:space="preserve"
			class="absolute inset-0 overflow-visible fill-none stroke-border"
			style="vector-effect: non-scaling-stroke;"
			aria-hidden="true"
		>
			<path
				stroke-width="1"
				d="M18.76 2.2175c2.1554.2528 3.9738-.275 5.7611-1.0511C29.24-.8826 33.5774-.2173 36.8282 2.9981c3.3174 3.2952 4.058 7.4996 1.9736 12.2317-1.4015 3.1799-1.3615 6.2356-.0133 9.4155 2.08 4.9095 1.3793 8.901-1.9647 12.2229-3.2198 3.1976-7.3798 3.9117-12.0632 1.8627-3.1799-1.3926-6.2356-1.4591-9.4066-.0266-4.3862 1.9824-8.5196 1.5877-12.0987-1.7917-3.2952-3.1134-4.0802-7.5129-2.0445-12.245 1.4103-3.2819 1.3749-6.3509-.0443-9.6106C-.7406 10.6839-.3371 6.5239 3.1267 2.9848 6.28-.2351 10.6972-.8293 15.4249 1.1575c1.0156.4258 2.1022.6919 3.3351 1.06Z"
			/>
		</svg>
	</div>
{/snippet}

<!-- Gradient overlay -->
<div
	class="fixed right-0 bottom-0 left-0 z-20 h-16 bg-linear-to-b from-transparent to-background to-80%"
></div>

<div class="fixed right-1 bottom-1 left-1 z-20 p-2">
	<div class="mx-auto flex max-w-150 flex-row gap-2">
		<a
			aria-label="Main page (Map)"
			class={cn(
				'shrink-0 transition-all duration-300 ease-back-out',
				Globals.navStates.search && 'translate-y-[150%]'
			)}
			href={resolve('/app')}
		>
			<div class="relative size-10 p-2.5 text-foreground">
				{@render backgroundShape()}
				<Home class="size-full" />
			</div>
		</a>

		<button
			aria-label="Manage your saved lists"
			class={cn(
				'shrink-0 transition-all duration-300 ease-back-out',
				Globals.navStates.search && 'translate-y-[150%]'
			)}
			onclick={() => {
				if (Globals.mapFilterList.length > 0) {
					Globals.mapFilterList = [];
					Globals.resetMapView();
				} else {
					Globals.navStates.bookmarks = !Globals.navStates.bookmarks;
				}
			}}
		>
			<div class="relative size-10 p-2.5 text-foreground">
				{@render backgroundShape()}
				{#if Globals.mapFilterList.length > 0}
					<div class="z-10 size-full" in:scale={{ duration: 200 }}>
						<div class="size-full">
							<X class="size-full" />
						</div>
					</div>
				{:else}
					<div class="z-10 size-full" in:scale={{ duration: 200 }}>
						<div class="size-full">
							<Bookmark class="size-full" />
						</div>
					</div>
				{/if}
			</div>
		</button>

		<button
			aria-label="Manage your saved lists"
			class="relative flex h-10 w-full flex-row items-center justify-center rounded-full border border-border bg-input/50 p-2.5 text-foreground backdrop-blur-sm"
			onclick={() => {
				goto(resolve('/'));
				Globals.navStates.search = !Globals.navStates.search;
			}}
		>
			{#if Globals.navStates.search}
				<div class="z-10 aspect-square h-full" in:scale={{ duration: 200 }}>
					<div class="size-full">
						<X class="size-full" />
					</div>
				</div>
			{:else}
				<div class="z-10 aspect-square h-full" in:scale={{ duration: 200 }}>
					<div class="size-full">
						<Search class="size-full" />
					</div>
				</div>
			{/if}
			{#if !Globals.navStates.search}
				<span class="text-base ltr:ml-2 rtl:ml-2" transition:slide={{ duration: 200, axis: 'x' }}
					>Search</span
				>
			{/if}
		</button>

		<a
			href={resolve('/app/account')}
			aria-label="Manage your account"
			class={cn(
				'shrink-0 transition-all duration-300 ease-back-out',
				Globals.navStates.search && 'translate-y-[150%]'
			)}
		>
			<div class="relative size-10 p-2.5 text-foreground">
				{@render backgroundShape()}
				<User class="size-full" />
			</div>
		</a>

		<button
			onclick={() => (aboutOpen = !aboutOpen)}
			class={cn(
				'shrink-0 transition-all duration-300 ease-back-out',
				Globals.navStates.search && 'translate-y-[150%]'
			)}
		>
			<div class="relative size-10 p-2.5 text-foreground">
				{@render backgroundShape()}
				<BadgeQuestionMark class="size-full" />
			</div>
		</button>
	</div>
</div>

{#if aboutOpen}
	<div
		class="fixed inset-0 z-30 bg-background/50 backdrop-blur-xs"
		transition:fade={{ duration: 200 }}
	></div>
	<div
		class="fixed top-1/2 left-1/2 z-30 flex max-h-[90vh] w-[90%] max-w-125 -translate-x-1/2 -translate-y-1/2 flex-col space-y-8 rounded border border-border bg-card p-4"
		transition:scale={{ duration: 200, start: 0.5 }}
	>
		<div class="space-y-6 overflow-y-auto">
			<section class="space-y-1">
				<h2 class="text-2xl font-medium">About Dine Map</h2>
				<div class="space-y-2">
					<p>Dine map was created as an alternative to google maps for saving restaurants.</p>
					<p>It is an open source project built with SvelteKit and OpenLayers.</p>
					<p>
						It first was a simple search and save app, but later evolved to a full multi-user review
						and saving platform.
					</p>
					<p>
						If you like this project, please consider starring it on GitHub to show your support!
						<iframe
							src="https://ghbtns.com/github-btn.html?user=Angus-Paillaugue&repo=dine-map&type=star&count=true&size=large"
							frameborder="0"
							scrolling="0"
							width="170"
							height="30"
							title="GitHub"
							loading="lazy"
							style="border: 0; overflow: hidden;"
						></iframe>
					</p>
				</div>
			</section>

			<section class="space-y-1">
				<h2 class="text-2xl font-medium">Credits</h2>
				<ul class="list-inside list-disc space-y-1 text-sm">
					<li>
						<b>Map Data</b>: &copy;
						<a href="https://www.openstreetmap.org/copyright" class="underline" target="_blank"
							>OpenStreetMap</a
						> contributors
					</li>
				</ul>
			</section>
		</div>

		<div class="flex flex-row items-center justify-end gap-2">
			<Button variant="outline" onclick={() => (aboutOpen = false)}>Close</Button>
		</div>
	</div>
{/if}
