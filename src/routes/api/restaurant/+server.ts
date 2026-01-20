import { RestaurantDAO } from '$lib/server/db/RestaurantDAO';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { NewRestaurantZ, RestaurantZ } from '$lib/types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const params = url.searchParams;
	const id = params.get('id');
	const user = locals.user!;
	if (id) {
		const isOwner = await RestaurantDAO.checkOwnership(id, user.id);
		if (!isOwner) {
			return json({ error: 'Unauthorized' }, { status: 403 });
		}
		const restaurant = await RestaurantDAO.getRestaurantById(id);
		if (!restaurant) {
			return json({ error: 'Restaurant not found' }, { status: 404 });
		}
		return json(restaurant);
	} else {
		const allRestaurants = await RestaurantDAO.getAllRestaurants(user.id);
		return json(allRestaurants);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const schema = NewRestaurantZ.omit({ createdBy: true });
	const body = await request.json();
	const parseResult = schema.safeParse(body);
	if (!parseResult.success) {
		return json({ error: 'Invalid request body', details: parseResult.error }, { status: 400 });
	}
	const user = locals.user!;
	const newRestaurant = { ...parseResult.data, createdBy: user.id };
	const createdRestaurant = await RestaurantDAO.createRestaurant(newRestaurant);
	return json(createdRestaurant, { status: 201 });
};

export const PUT: RequestHandler = async ({ request, locals }) => {
	const schema = RestaurantZ.pick({ id: true, name: true, icon: true });
	const body = await request.json();
	const parseResult = schema.safeParse(body);
	if (!parseResult.success) {
		return json({ error: 'Invalid request body', details: parseResult.error }, { status: 400 });
	}
	const { id, name, icon } = parseResult.data;
	const user = locals.user!;
	const isOwner = await RestaurantDAO.checkOwnership(id, user.id);
	if (!isOwner) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}
	const updatedRestaurant = await RestaurantDAO.updateRestaurant(id, { name, icon });
	if (!updatedRestaurant) {
		return json({ error: 'Restaurant not found' }, { status: 404 });
	}
	return json(updatedRestaurant);
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	const body = await request.json();
	const schema = RestaurantZ.pick({ id: true });
	const parseResult = schema.safeParse(body);
	if (!parseResult.success) {
		return json({ error: 'Invalid request body', details: parseResult.error }, { status: 400 });
	}
	const { id } = parseResult.data;
	const user = locals.user!;
	const isOwner = await RestaurantDAO.checkOwnership(id, user.id);
	if (!isOwner) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}
	await RestaurantDAO.deleteRestaurant(id);
	return json({ success: true });
};
