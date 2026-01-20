<script lang="ts">
	import { page } from '$app/state';
	import type { User } from '$lib/types';
	import { LogOut } from '@lucide/svelte';
	import Contributions from './Contributions.svelte';
	import { resolve } from '$app/paths';
	import AnimateLoad from '$lib/components/AnimateLoad.svelte';

	let user = $derived(page.data.user as User);
</script>

<div class="mx-auto w-full max-w-250">
	<section class="w-full space-y-6 p-2">
		<h1 class="text-2xl font-light">Welcome, <b class="font-bold">{user.username}</b></h1>
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
	<Contributions />
</div>
