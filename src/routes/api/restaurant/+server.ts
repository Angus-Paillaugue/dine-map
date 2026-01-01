import { RestaurantDAO } from '$lib/server/db/RestaurantDAO';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { NewRestaurantZ } from '$lib/types';

export const GET: RequestHandler = async ({ url }) => {
	const params = url.searchParams;
	const id = params.get('id');
	if(id) {
		const restaurant = await RestaurantDAO.getRestaurantById(id);
		if(!restaurant) {
			return json({ error: 'Restaurant not found' }, { status: 404 });
		}
		return json(restaurant);
	}else {
		const allRestaurants = await RestaurantDAO.getAllRestaurants();
		return json(allRestaurants);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	const schema = NewRestaurantZ;
	const body = await request.json();
	const parseResult = schema.safeParse(body);
	if (!parseResult.success) {
		return json({ error: 'Invalid request body', details: parseResult.error }, { status: 400 });
	}
	const newRestaurant = parseResult.data;
	const createdRestaurant = await RestaurantDAO.createRestaurant(newRestaurant);
	return json(createdRestaurant, { status: 201 });
};
