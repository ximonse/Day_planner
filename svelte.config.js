import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		alias: { '$components': path.resolve('./src/components') }
	}
};
