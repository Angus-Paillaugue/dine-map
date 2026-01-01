import { RestaurantDAO } from '$lib/server/db/RestaurantDAO';
import type { PageServerLoad } from './$types';
import { TILE_CUSTOM } from '$env/static/private';

export const load = (async () => {
	const restaurants = await RestaurantDAO.getAllRestaurants();
	return {
		restaurants,
		TILE_CUSTOM: TILE_CUSTOM === 'true'
	};
}) satisfies PageServerLoad;
