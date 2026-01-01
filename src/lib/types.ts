import z from 'zod';

export const UUIDZ = z.uuid();
export type UUID = z.infer<typeof UUIDZ>;

export const CoordinatesZ = z.tuple([z.number(), z.number()]);
export type Coordinates = z.infer<typeof CoordinatesZ>;

export const ViewboxZ = z.tuple([z.number(), z.number(), z.number(), z.number()]);
export type Viewbox = z.infer<typeof ViewboxZ>;

export const ReviewZ = z.object({
	id: UUIDZ,
	rating: z.number().min(0).max(5),
	comment: z.string(),
	restaurantId: UUIDZ,
	date: z.date()
});
export type Review = z.infer<typeof ReviewZ>;
export const NewReviewZ = ReviewZ.omit({ id: true, date: true });
export type NewReview = z.infer<typeof NewReviewZ>;

export const RestaurantZ = z.object({
	id: UUIDZ,
	name: z.string(),
	coordinates: CoordinatesZ,
	rating: z.number().min(0).max(5),
	reviews: z.array(z.lazy(() => ReviewZ))
});
export type Restaurant = z.infer<typeof RestaurantZ>;
export const NewRestaurantZ = RestaurantZ.omit({ id: true, reviews: true, rating: true });
export type NewRestaurant = z.infer<typeof NewRestaurantZ>;
