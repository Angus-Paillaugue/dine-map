import { ListDAO } from '$lib/server/db/ListDAO';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ListZ, RestaurantZ } from '$lib/types';
import z from 'zod';

export const POST: RequestHandler = async ({ request, locals }) => {
	const body = await request.json();
	const schema = z.object({
		restaurantId: RestaurantZ.shape.id,
		listId: ListZ.shape.id
	});
	const parseResult = schema.safeParse(body);
	if (!parseResult.success) {
		return json({ error: 'Invalid request body', details: parseResult.error }, { status: 400 });
	}
	const { restaurantId, listId } = parseResult.data;
	const user = locals.user!;
	const isOwner = await ListDAO.checkOwnership(listId, user.id);
	if (!isOwner) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}
	await ListDAO.addRestaurantToList(restaurantId, listId);

	return json({ success: true }, { status: 201 });
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	const body = await request.json();
	const schema = z.object({
		restaurantId: RestaurantZ.shape.id,
		listId: ListZ.shape.id
	});
	const parseResult = schema.safeParse(body);
	if (!parseResult.success) {
		return json({ error: 'Invalid request body', details: parseResult.error }, { status: 400 });
	}
	const { restaurantId, listId } = parseResult.data;
	const user = locals.user!;
	const isOwner = await ListDAO.checkOwnership(listId, user.id);
	if (!isOwner) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}
	await ListDAO.removeRestaurantFromList(restaurantId, listId);
	return json({ success: true }, { status: 200 });
};
