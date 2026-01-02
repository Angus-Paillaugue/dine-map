import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const CACHE_DURATION = 60 * 60 * 24 * 30; // 30 days

export const GET: RequestHandler = async ({ fetch, params }) => {
	const { z, x, y } = params;
	const { TILES_HOST, TILES_PORT } = env;
	const URL = `http://${TILES_HOST}:${TILES_PORT}/styles/dark-matter/512/{z}/{x}/{y}.png`;

	const replacedUrl = URL.replace('{z}', z).replace('{x}', x).replace('{y}', y);
	const response = await fetch(replacedUrl);
	return new Response(response.body, {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': `public, max-age=${CACHE_DURATION}, immutable`
		}
	});
};
