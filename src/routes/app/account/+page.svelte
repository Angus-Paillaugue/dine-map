<script lang="ts">
	import { page } from '$app/state';
	import type { Restaurant, User } from '$lib/types';
	import { ClockIcon, HeartIcon, LogOut, StarIcon } from '@lucide/svelte';
	import Contributions from './Contributions.svelte';
	import { resolve } from '$app/paths';
	import AnimateLoad from '$lib/components/AnimateLoad.svelte';
	import * as Carousel from '$lib/components/ui/carousel';
	import Globals from '$lib/globals.svelte';
	import * as Empty from '$lib/components/ui/empty';
	import { Button } from '$lib/components/ui/button';

	let user = $derived(page.data.user as User);
	let restaurants = $derived(page.data.restaurants as Restaurant[]);
	let favoriteRestaurants = $derived(
		restaurants
			.filter((restaurant) => restaurant.reviews.length > 0)
			.sort((a, b) => b.reviews.length - a.reviews.length)
			.slice(0, 10)
	);
</script>

<svelte:head>
	<title>Account - Dine Map</title>
</svelte:head>

<div class="mx-auto w-full max-w-250 space-y-8">
	<section class="mt-6 w-full space-y-6 px-2">
		<h1 class="text-3xl font-light">Welcome, <b class="font-bold">{user.username}</b></h1>
		<AnimateLoad class="grid grid-cols-2">
			<a
				href={resolve('/auth/log-out')}
				class="flex flex-col gap-4 rounded border border-border bg-card p-4"
			>
				<LogOut class="size-6" />
				<span class="text-lg font-bold">Log-out</span>
			</a>
		</AnimateLoad>
	</section>

	<hr class="mx-6 border-dashed" />

	<section class="w-full space-y-2 px-2">
		<h2 class="text-xl font-medium">
			<ClockIcon class="mr-2 mb-1 inline text-foreground" />
			Yearly contributions
		</h2>
		<Contributions />
	</section>

	<hr class="mx-6 border-dashed" />

	<section class="w-full space-y-2">
		<div class="px-2">
			<h2 class="text-xl font-medium">
				<HeartIcon class="mr-2 mb-1 inline fill-current text-red-500/50" />
				Favorite places
			</h2>
		</div>
		{#if favoriteRestaurants.length > 0}
			<Carousel.Root>
				<Carousel.Content class="-ms-2 first:pl-2 last:mr-2">
					{#each favoriteRestaurants as r, i (r.id)}
						<Carousel.Item class="basis-[70%] ps-2 sm:basis-[40%] md:basis-[35%] lg:basis-[30%]">
							<button
								onclick={() => (Globals.restaurantDetailsId = r.id)}
								class="flex h-32 w-full flex-row items-center gap-6 overflow-hidden rounded border border-border bg-card px-4 py-6 text-start select-none"
							>
								<div class="relative">
									<span
										class="absolute inset-0 animate-[pulse_3s_cubic-bezier(0.4,0,0.6,1)_infinite] text-6xl blur-3xl"
										style="animation-delay: {i * 500}ms;">{r.icon}</span
									>
									<span class="text-6xl">{r.icon}</span>
								</div>
								<div class="flex flex-col gap-2">
									<h2 class="line-clamp-1 text-xl font-bold">{r.name}</h2>
									<p class="text-sm text-muted-foreground"><b>{r.reviews.length}</b> Visits</p>
								</div>
							</button>
						</Carousel.Item>
					{/each}
				</Carousel.Content>
			</Carousel.Root>
		{:else}
			<Empty.Root>
				<Empty.Header>
					<Empty.Media variant="icon">
						<StarIcon />
					</Empty.Media>
					<Empty.Title>No Reviews Yet</Empty.Title>
					<Empty.Description>
						You haven't reviewed any restaurants yet. Start exploring and share your dining
						experiences!
					</Empty.Description>
				</Empty.Header>
				<Empty.Content>
					<Button href={resolve('/')}>Explore Restaurants</Button>
				</Empty.Content>
			</Empty.Root>
		{/if}
	</section>
</div>
