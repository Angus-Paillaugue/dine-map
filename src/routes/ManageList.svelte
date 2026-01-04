<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import Globals from '$lib/globals.svelte';
	import {
		availableEmojis,
		type MapCtx,
		MapCtxKey,
		type List,
		type NewList,
		type Restaurant
	} from '$lib/types';
	import { Bookmark, Map, Pen, Plus, Save, Trash, Upload, X } from '@lucide/svelte';
	import { fade, scale, slide } from 'svelte/transition';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { invalidateAll } from '$app/navigation';
	import { cn } from '$lib/utils';
	import EmojiPicker from '$lib/components/emojiPicker/emojiPicker.svelte';
	import Toaster from '$lib/components/Toast';
	import FileDropZone from '$lib/components/FileDropZone.svelte';
	import { getContext } from 'svelte';
	import { linear } from 'svelte/easing';

	let restaurant = $derived(
		(page.data.restaurants as Restaurant[]).find((r) => r.id === Globals.toggleList) || null
	);
	let lists = $derived<List[]>(page.data.lists);
	let createListOpen = $state(false);
	let createListContent = $state({ name: '', description: '' });
	let isCreatingList = $state(false);
	let editListId = $state<List['id'] | null>(null);
	let listDetailsId = $state<List['id'] | null>(null);
	let uploadFromFile = $state<{
		open: boolean;
		processing: boolean;
		files: File[] | null;
	}>({ open: false, processing: false, files: null });
	let deleteListStates = $state<{ processing: boolean; open: boolean; list: List | null }>({
		processing: false,
		open: false,
		list: null
	});
	let editedList = $state<Required<NewList>>({
		name: '',
		description: '',
		icon: availableEmojis[0]
	});
	const mapCtx = getContext<MapCtx>(MapCtxKey);

	async function createList() {
		isCreatingList = true;
		// Implement list creation logic here
		const res = await fetch('/api/list', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(createListContent)
		});
		if (!res.ok) {
			Toaster.error('Failed to create list');
			const data = await res.json();
			console.error('Failed to create list', data);
			isCreatingList = false;
			return;
		}
		await invalidateAll();
		isCreatingList = false;
		createListOpen = false;
	}

	async function addToList(listId: List['id'], restaurantId: Restaurant['id']) {
		const res = await fetch(`/api/list/item`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ listId, restaurantId })
		});
		if (!res.ok) {
			const data = await res.json();
			Toaster.error('Failed to add restaurant to list');
			console.error('Failed to add restaurant to list', data);
			return;
		}
		await invalidateAll();
		Globals.toggleList = null;
	}

	async function removeFromList(listId: List['id'], restaurantId: Restaurant['id']) {
		const res = await fetch(`/api/list/item`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ listId, restaurantId })
		});
		if (!res.ok) {
			Toaster.error('Failed to remove restaurant from list');
			const data = await res.json();
			console.error('Failed to remove restaurant from list', data);
			return;
		}
		await invalidateAll();
		Globals.toggleList = null;
	}

	async function toggleRestaurantInList(listId: List['id']) {
		if (!restaurant) return;
		if (isRestaurantInList(listId)) {
			await removeFromList(listId, restaurant.id);
		} else {
			await addToList(listId, restaurant.id);
		}
	}

	const isRestaurantInList = (listId: List['id']) => {
		if (!restaurant) return false;
		const list = lists.find((l) => l.id === listId);
		if (!list) return false;
		return list.restaurants.map((r) => r.id).includes(restaurant.id);
	};

	async function saveList() {
		// TODO: fix restaurants array being passed tin the PUT request
		const res = await fetch(`/api/list`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ ...editedList, id: editListId })
		});
		if (!res.ok) {
			Toaster.error('Failed to save list');
			const data = await res.json();
			console.error('Failed to save list', data);
			return;
		}
		editListId = null;
		await invalidateAll();
	}

	async function deleteList() {
		if (!editListId) return;
		const res = await fetch(`/api/list`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ id: editListId })
		});
		if (!res.ok) {
			Toaster.error('Failed to delete list');
			const data = await res.json();
			console.error('Failed to delete list', data);
			return;
		}
		editListId = null;
		deleteListStates = { processing: false, open: false, list: null };
		await invalidateAll();
	}

	$effect(() => {
		if (editListId) {
			const list = lists.find((l) => l.id === editListId);
			if (list) {
				editedList = { name: list.name, description: list.description || '', icon: list.icon };
			}
		}
	});

	$effect(() => {
		if (!restaurant && !Globals.manageLists) {
			editListId = null;
			editedList = { name: '', description: '', icon: availableEmojis[0] };
			isCreatingList = false;
			createListContent = { name: '', description: '' };
			createListOpen = false;
			listDetailsId = null;
			deleteListStates = { processing: false, open: false, list: null };
		}
	});

	function onListItemClick(event: MouseEvent, listId: List['id']) {
		const target = event.target as HTMLElement;
		if (!target.closest('.listItem') || target.closest('button') || editListId) return;

		listDetailsId = listDetailsId ? null : listId;
	}

	async function onFileUploadComplete(files: File[]) {
		if (files.length === 0) return;
		uploadFromFile.processing = true;
		uploadFromFile.files = files;
		const formData = new FormData();
		for (const file of files) {
			formData.append('files[]', file);
		}
		const res = await fetch('/api/list/import', {
			method: 'POST',
			body: formData
		});
		const data = await res.json();
		if (!res.ok) {
			Toaster.error('Failed to import lists from file');
			console.error('Failed to import lists from file', data);
		} else {
			const { listNames } = data;
			Toaster.success(`List${listNames.length > 1 ? 's' : ''} imported successfully`);
			await invalidateAll();
		}
		uploadFromFile.processing = false;
		uploadFromFile.open = false;
		uploadFromFile.files = null;
	}
</script>

{#snippet listIcon(icon: List['icon'], id: List['id'], isEditing: boolean)}
	<div
		class="relative flex size-12 shrink-0 flex-col items-center justify-center overflow-hidden rounded-[42%] border border-border bg-secondary"
	>
		<span class="text-2xl">{icon}</span>
		{#if isRestaurantInList(id) && !isEditing}
			<div class="absolute inset-0 flex flex-col items-center justify-center bg-card/70">
				<X class="size-6 text-destructive" />
			</div>
		{/if}
	</div>
{/snippet}

{#if uploadFromFile.open}
	<div
		class="fixed inset-0 z-30 bg-background/50 backdrop-blur-xs"
		transition:fade={{ duration: 200 }}
	></div>
	<div
		class="fixed top-1/2 left-1/2 z-30 max-h-dvh w-[90%] max-w-125 -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded border border-border bg-card p-4"
		transition:scale={{ duration: 200, start: 0.5 }}
	>
		<div class="flex flex-row items-center justify-start gap-1">
			<Upload class="size-6" />
			<h1 class="text-2xl font-medium">Upload from file</h1>
		</div>
		<div class="mt-4 flex flex-col gap-2">
			<p class="text-sm font-light">
				Upload your saved lists directly from Google Takeout into Dine Map.
			</p>
			<p class="text-sm font-light">
				To export your data, go to <a
					href="https://takeout.google.com/"
					class="rounded-sm bg-primary/10 px-1 py-0.5 font-medium"
					target="_blank">Google Takeout</a
				>
			</p>
			<p class="text-sm font-light">
				Only select one checkbox : <span class="rounded-sm bg-primary/10 px-1 py-0.5 font-medium"
					>"Saved"</span
				>, then export your data as a zip.
			</p>
			<p class="text-sm font-light">
				It should become available to download in a few minutes. Once exported, you can download it,
				extract the zip and lok for a directory containing multiple CSV files named after your saved
				lists.
			</p>
			<p class="text-sm font-light">
				You can directly upload those scv files bellow and we'll do the rest 😉.
			</p>
		</div>

		<FileDropZone
			accept="text/csv"
			loading={uploadFromFile.processing}
			class="mt-4 h-36"
			onUpload={onFileUploadComplete}
			onFileRejected={({ reason }) => {
				Toaster.error(`File upload failed: ${reason}`);
			}}
		/>
		<div class="mt-4 flex w-full flex-row items-end justify-end">
			<Button
				variant="outline"
				onclick={() => {
					uploadFromFile.open = false;
				}}
				disabled={uploadFromFile.processing}
			>
				Close
			</Button>
		</div>
	</div>
{/if}

<!-- Trigger -->
<button
	aria-label="Manage your saved lists"
	class="absolute top-2 right-2 z-10"
	onclick={() => {
		if (Globals.mapFilterList.length > 0) {
			Globals.mapFilterList = [];
			mapCtx.resetMapView();
		} else {
			Globals.manageLists = !Globals.manageLists;
		}
	}}
>
	<div class="relative size-10 p-2.5 text-foreground">
		<svg
			version="1.1"
			xmlns="http://www.w3.org/2000/svg"
			xmlns:xlink="http://www.w3.org/1999/xlink"
			x="0px"
			y="0px"
			width="100%"
			viewBox="0 0 90 90"
			enable-background="new 0 0 90 90"
			xml:space="preserve"
			class="absolute inset-0 -z-10 text-secondary"
			><path
				fill="currentColor"
				opacity="1"
				stroke="none"
				d="M42.3 5c-2.784-.8339-5.2273-1.427-7.516-2.3882C24.1225-1.8657 14.1606-.5302 7.047 6.735-.762 14.7105-1.6695 24.0876 2.6313 33.9506c3.203 7.3454 3.2792 14.2704.0952 21.6659-4.5933 10.669-2.8243 20.5927 4.6069 27.6086 8.0742 7.623 17.3897 8.5081 27.2756 4.0417 7.1468-3.2289 14.0366-3.0809 21.2053.0556 10.5577 4.6194 19.9433 3.0062 27.1979-4.1975 7.5443-7.4914 9.1175-16.4868 4.4276-27.558-3.0368-7.1689-3.1289-14.0642.03-21.2335 4.7029-10.6735 3.0314-20.1477-4.4543-27.5759C75.707-.4949 65.9256-1.9883 55.2899 2.6308 51.2565 4.3825 47.1601 5.5714 42.3 5Z"
			/></svg
		>
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

{#if (restaurant || Globals.manageLists) && !uploadFromFile.open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-30 bg-background/50 backdrop-blur-xs"
		transition:fade={{ duration: 200 }}
	></div>
	<!-- Main dialog -->
	<div
		class="fixed top-1/2 left-1/2 z-30 flex max-h-[90vh] w-[90%] max-w-125 -translate-x-1/2 -translate-y-1/2 flex-col rounded border border-border bg-card px-2 py-4"
		transition:scale={{ duration: 200, start: 0.5 }}
	>
		{#if restaurant}
			<h2 class="px-2 text-xl font-medium">Save {restaurant.name}</h2>
		{/if}
		{#if !restaurant}
			<!-- Header -->
			<div class="flex flex-row items-center justify-between px-2">
				<h1 class="text-xl font-medium">Manage lists</h1>
				<Button size="icon-sm" onclick={() => (uploadFromFile.open = true)}>
					<Upload class="size-4" />
				</Button>
			</div>
		{/if}
		<div class={cn('mt-6 flex min-h-0 flex-1 flex-col overflow-y-auto')}>
			{#if restaurant}
				{#each lists as list (list.id)}
					<button
						onclick={() => toggleRestaurantInList(list.id)}
						class={cn(
							'flex flex-row items-center justify-start gap-2 p-2 text-start',
							createListOpen && 'pointer-events-none blur-xs'
						)}
					>
						{@render listIcon(list.icon, list.id, false)}
						<div class="flex flex-col">
							<span class="text-lg font-medium">
								{list.name}
							</span>
							<span class="line-clamp-1 text-sm font-normal text-muted-foreground">
								{list.description}
							</span>
						</div>
					</button>
				{/each}
			{:else}
				{#each lists as list (list.id)}
					{@const isEditingThisList = editListId === list.id}
					<div
						class={cn(
							'relative flex flex-col p-2 transition-all duration-300',
							(createListOpen ||
								(listDetailsId && listDetailsId !== list.id) ||
								(editListId && !isEditingThisList)) &&
								'pointer-events-none blur-xs'
						)}
					>
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<div
							onclick={(e) => onListItemClick(e, list.id)}
							tabindex={0}
							role="button"
							class="listItem flex flex-row items-center justify-start gap-2 text-start transition-all"
						>
							{#if isEditingThisList}
								<EmojiPicker
									class="shrink-0"
									selectedEmoji={editedList.icon}
									onSelect={(emoji) => {
										editedList.icon = emoji;
									}}
								>
									{@render listIcon(editedList.icon, list.id, isEditingThisList)}
								</EmojiPicker>
							{:else}
								{@render listIcon(list.icon, list.id, isEditingThisList)}
							{/if}
							<div class="relative h-full grow">
								{#if isEditingThisList}
									<div class="flex flex-col gap-1" transition:slide={{ axis: 'y' }}>
										<Input bind:value={editedList.name} placeholder="Name" />
										<Textarea
											id="newListDescription"
											bind:value={editedList.description}
											placeholder="Description"
											class="resize-none"
											autoFit={{ active: true, maxRows: 4 }}
										/>
									</div>
								{:else}
									<div
										class="absolute top-1/2 right-0 left-0 flex -translate-y-1/2 flex-col"
										in:slide={{ axis: 'y' }}
									>
										<span class="text-lg font-medium">
											{list.name}
											<span class="text-sm text-muted-foreground">({list.restaurants.length})</span>
										</span>
										<span class="line-clamp-1 text-sm font-normal text-muted-foreground">
											{list.description}
										</span>
									</div>
								{/if}
							</div>

							<div class="flex flex-col">
								{#if listDetailsId !== list.id}
									<div transition:slide={{ axis: 'x', duration: 200 }}>
										<Button
											class="shrink-0"
											size="icon-sm"
											onclick={() => {
												listDetailsId = null;
												if (isEditingThisList) {
													saveList();
												} else {
													editListId = list.id;
												}
											}}
										>
											{#if isEditingThisList}
												<div class="size-4" in:scale={{ duration: 200 }}>
													<Save class="size-full" />
												</div>
											{:else}
												<div class="size-4" in:scale={{ duration: 200 }}>
													<Pen class="size-full" />
												</div>
											{/if}
										</Button>
									</div>
								{/if}
								{#if editListId === list.id}
									<div class="mt-2 shrink-0" transition:slide={{ axis: 'y' }}>
										<Button
											variant="destructive"
											size="icon-sm"
											onclick={() => (deleteListStates = { ...deleteListStates, open: true, list })}
										>
											<Trash class="size-4" />
										</Button>
									</div>
								{/if}
							</div>
						</div>
						<!-- List of restaurants details -->
						{#if listDetailsId === list.id}
							<div
								class="mt-2 flex flex-col gap-2"
								transition:slide={{ duration: 300, easing: linear, axis: 'y' }}
							>
								{#each list.restaurants as restaurant (restaurant.id)}
									<div
										class="flex flex-row justify-between rounded border border-border p-2"
										transition:slide={{ duration: 200, axis: 'y' }}
									>
										<div class="flex flex-row items-center gap-2">
											<span class="text-lg">{restaurant.icon}</span>
											<p class="line-clamp-1 text-lg font-medium">
												{restaurant.name}
											</p>
										</div>
										<Button
											variant="destructive"
											size="icon-sm"
											onclick={() => removeFromList(list.id, restaurant.id)}
										>
											<Trash class="size-4" />
										</Button>
									</div>
								{:else}
									<div
										class="text-sm text-muted-foreground"
										in:slide={{ duration: 200, axis: 'y', delay: 200 }}
										out:slide={{ duration: 200, axis: 'y' }}
									>
										No restaurants in this list.
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
		{#if createListOpen}
			<div class="mt-6 flex shrink-0 flex-col gap-2 px-2" transition:slide={{ duration: 300 }}>
				<Input bind:value={createListContent.name} placeholder="Name" />
				<Textarea
					id="newListDescription"
					bind:value={createListContent.description}
					placeholder="Description"
					class="resize-none"
					autoFit={{ active: true, maxRows: 4 }}
				/>
			</div>
		{/if}

		<!-- Footer -->
		<div
			class={cn(
				'flex shrink-0 flex-row items-center px-2 transition-all',
				createListOpen ? 'mt-2' : 'mt-6'
			)}
		>
			{#if !editListId}
				<div class="w-full ltr:mr-2 rtl:ml-2" transition:slide={{ axis: 'x', duration: 300 }}>
					<Button
						class="flex w-full flex-row gap-2"
						onclick={() => {
							if (createListOpen) {
								createList();
							} else if (listDetailsId) {
								Globals.mapFilterList = [listDetailsId];
								Globals.manageLists = false;
								Globals.toggleList = null;
								listDetailsId = null;
								mapCtx.resetMapView();
							} else {
								createListOpen = true;
							}
						}}
						disabled={createListOpen && (createListContent.name.trim() === '' || isCreatingList)}
					>
						{#if listDetailsId}
							<span class="size-4" in:scale={{ duration: 200 }}>
								<Map class="size-4" />
							</span>
						{:else}
							<span class="size-4" in:scale={{ duration: 200 }}>
								<Plus class="size-4" />
							</span>
						{/if}
						{listDetailsId ? 'See on map' : createListOpen ? 'Create' : 'Create new list'}
					</Button>
				</div>
			{/if}
			<Button
				variant="outline"
				class="ltr:ml-auto rtl:mr-auto"
				onclick={() => {
					if (createListOpen) {
						createListOpen = false;
					} else if (editListId) {
						editListId = null;
					} else if (listDetailsId) {
						listDetailsId = null;
					} else {
						Globals.toggleList = null;
						Globals.manageLists = false;
					}
				}}>{createListOpen || editListId ? 'Cancel' : 'Close'}</Button
			>
		</div>
	</div>
{/if}

<!-- Delete list confirm dialog -->
{#if deleteListStates.open}
	<div
		class="fixed inset-0 z-30 bg-background/50 backdrop-blur-xs"
		transition:fade={{ duration: 200 }}
	></div>
	<div
		class="fixed top-1/2 left-1/2 z-30 w-[90%] max-w-125 -translate-x-1/2 -translate-y-1/2 space-y-6 rounded border border-border bg-card p-4"
		transition:scale={{ duration: 200, start: 0.5 }}
	>
		<h2 class="text-xl font-medium">Delete {deleteListStates.list!.name}</h2>
		<p>Are you sure you want to delete this list? This action cannot be undone.</p>

		<div class="flex flex-row items-center justify-end gap-2">
			<Button
				variant="outline"
				onclick={() => (deleteListStates.open = false)}
				disabled={deleteListStates.processing}>Cancel</Button
			>
			<Button
				variant="destructive"
				onclick={deleteList}
				disabled={deleteListStates.processing}
				loading={deleteListStates.processing}>Delete</Button
			>
		</div>
	</div>
{/if}
