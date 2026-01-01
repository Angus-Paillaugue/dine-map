import z from 'zod';
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { ReviewDAO } from '$lib/server/db/ReviewDAO';
import { NewReviewZ } from '$lib/types';
const UUIDZ = z.uuid();

export const GET: RequestHandler = async ({ url }) => {
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
	if (restaurantId) {
		const reviews = await ReviewDAO.getReviewsForRestaurant(restaurantId);
		return json(reviews);
	}
	const review = await ReviewDAO.getReviewById(id!);
	return json(review, { status: review ? 200 : 404 });
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const schema = NewReviewZ;
  const parseResult = schema.safeParse(body);
  if (!parseResult.success) {
    return json({ errors: parseResult.error }, { status: 400 });
  }
  const newReview = parseResult.data;
  const createdReview = await ReviewDAO.createReview(newReview);
  return json(createdReview, { status: 201 });
};

export const DELETE: RequestHandler = async () => {
	// Delete a review based on it's ID
	return new Response();
};

export const PUT: RequestHandler = async () => {
	// Update a review based on it's ID
	return new Response();
};
