import z from 'zod';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { ReviewDAO } from '$lib/server/db/ReviewDAO';
import { NewReviewZ, ReviewZ } from '$lib/types';
import { RestaurantDAO } from '$lib/server/db/RestaurantDAO';
const UUIDZ = z.uuid();

export const GET: RequestHandler = async ({ url, locals }) => {
	const params = url.searchParams;
	const schema = z
		.object({
			id: UUIDZ.nullable(),
			restaurantId: UUIDZ.nullable()
		})
		.refine((data) => data.id || data.restaurantId, {
			message: 'Either id or restaurantId must be provided'
		})
		.refine((data) => !(data.id && data.restaurantId), {
			message: 'Only one of id or restaurantId can be provided'
		});
	const parseResult = schema.safeParse({
		id: params.get('id'),
		restaurantId: params.get('restaurantId')
	});
	if (!parseResult.success) {
		return json({ errors: parseResult.error }, { status: 400 });
	}
	const { id, restaurantId } = parseResult.data;
	const user = locals.user!;
	if (restaurantId) {
		const isOwner = await RestaurantDAO.checkOwnership(restaurantId, user.id);
		if (!isOwner) {
			return json({ error: 'Unauthorized' }, { status: 403 });
		}
		const reviews = await ReviewDAO.getReviewsForRestaurant(restaurantId);
		return json(reviews);
	}
	const isOwner = await ReviewDAO.checkOwnership(id!, user.id);
	if (!isOwner) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}
	const review = await ReviewDAO.getReviewById(id!);
	return json(review, { status: review ? 200 : 404 });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const body = await request.json();
	const schema = NewReviewZ.omit({ createdBy: true });
	const parseResult = schema.safeParse(body);
	if (!parseResult.success) {
		return json({ errors: parseResult.error }, { status: 400 });
	}
	const user = locals.user!;
	const newReview = { ...parseResult.data, createdBy: user.id };
	const createdReview = await ReviewDAO.createReview(newReview);
	return json(createdReview, { status: 201 });
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	const schema = ReviewZ.pick({ id: true });
	const body = await request.json();
	const parseResult = schema.safeParse(body);
	if (!parseResult.success) {
		return json({ errors: parseResult.error }, { status: 400 });
	}
	const { id } = parseResult.data;
	const user = locals.user!;
	const isOwner = await ReviewDAO.checkOwnership(id, user.id);
	if (!isOwner) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}
	await ReviewDAO.deleteReview(id);
	return json({ success: true }, { status: 204 });
};

export const PUT: RequestHandler = async ({ request, locals }) => {
	const body = await request.json();
	const schema = ReviewZ.pick({ id: true, rating: true, comment: true, date: true });
	const parseResult = schema.safeParse(body);
	if (!parseResult.success) {
		return json({ errors: parseResult.error }, { status: 400 });
	}
	const { id, ...updates } = parseResult.data;
	const user = locals.user!;
	const isOwner = await ReviewDAO.checkOwnership(id, user.id);
	if (!isOwner) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}
	const updatedReview = await ReviewDAO.updateReview(id, updates);
	if (!updatedReview) {
		return json({ error: 'Review not found' }, { status: 404 });
	}
	return json(updatedReview);
};
