import type { LayoutServerLoad } from './$types';
import { RestaurantDAO } from '$lib/server/db/RestaurantDAO';
import { ListDAO } from '$lib/server/db/ListDAO';

export const load = (async ({ request }) => {
	// Get user preferred locale
	const acceptLanguage = request.headers.get('accept-language');
	const userLocale = (acceptLanguage?.split(',').map((lang) => lang.split(';')[0].trim()) || [
		['en-US']
	])[0];
	const restaurants = await RestaurantDAO.getAllRestaurants();
	const lists = await ListDAO.getAllLists();
	return {
		restaurants,
		lists,
		locale: userLocale
	};
}) satisfies LayoutServerLoad;
