import type { LayoutServerLoad } from './$types';
import { RestaurantDAO } from '$lib/server/db/RestaurantDAO';
import { ListDAO } from '$lib/server/db/ListDAO';

export const load = (async ({ request, locals }) => {
	const user = locals.user!;

	const acceptLanguage = request.headers.get('accept-language');
	const userLocale = (acceptLanguage?.split(',').map((lang) => lang.split(';')[0].trim()) || [
		['en-US']
	])[0];

	const restaurants = await RestaurantDAO.getAllRestaurants(user.id);
	const lists = await ListDAO.getAllLists(user.id);

	return {
		restaurants,
		lists,
		locale: userLocale,
		user
	};
}) satisfies LayoutServerLoad;
