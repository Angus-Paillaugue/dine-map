<script lang="ts">
	import { flip } from 'svelte/animate';
	import { toasts } from './toast';
	import Toaster from '.';
</script>

<div class="fixed top-2 right-2 z-50 flex flex-col gap-2 transition-all max-md:left-2 md:w-100">
	{#each $toasts.slice(-4) as toast (toast.id)}
		<div animate:flip={{ duration: 300 }}>
			<Toaster.Toast {toast} />
		</div>
	{/each}
</div>
