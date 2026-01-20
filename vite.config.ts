import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	build: {
		rollupOptions: {
			external: ['bun']
		}
	},
	server: {
		allowedHosts: ['dine-map2.home.paillaugue.fr']
	}
});
