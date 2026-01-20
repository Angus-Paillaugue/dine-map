import z from 'zod';
import {
	availableEmojis as availableEmojisList,
	type AvailableEmoji as AvailableEmojiType
} from './emoji.js';

export const UUID = z.uuid();
export type UUID = z.infer<typeof UUID>;
export const DateZ = z.date().or(
	z
		.string()
		.refine((date) => !isNaN(Date.parse(date)), {
			message: 'Invalid date string'
		})
		.transform((date) => new Date(date))
);

export const CoordinatesZ = z.tuple([z.number(), z.number()]); // [longitude, latitude]
export type Coordinates = z.infer<typeof CoordinatesZ>;

export const ViewboxZ = z.tuple([z.number(), z.number(), z.number(), z.number()]); // [Top-Left Lon, Top-Left Lat, Bottom-Right Lon, Bottom-Right Lat]
export type Viewbox = z.infer<typeof ViewboxZ>;

// Emojis
export const availableEmojis = availableEmojisList;
export type AvailableEmojis = AvailableEmojiType;

// Review
export const ReviewZ = z.object({
	id: UUID,
	rating: z.number().min(0).max(5),
	comment: z.string(),
	restaurantId: UUID,
	date: z.date(),
	createdBy: UUID
});
export type Review = z.infer<typeof ReviewZ>;
export const NewReviewZ = ReviewZ.omit({ id: true, date: true });
export type NewReview = z.infer<typeof NewReviewZ>;

// Dietary preferences
export const DietaryPreferenceTypes = ['vegan', 'vegetarian', 'halal'] as const;
export type DietaryPreferenceType = (typeof DietaryPreferenceTypes)[number];
export const DietaryInfoZ = z.object({
	halal: z.boolean(),
	vegan: z.boolean(),
	vegetarian: z.boolean(),
	kosher: z.boolean()
});
export type DietaryInfo = z.infer<typeof DietaryInfoZ>;

// Restaurant
export const RestaurantNameMaxLength = 30;
export const RestaurantZ = z.object({
	id: UUID,
	name: z.string().max(RestaurantNameMaxLength),
	coordinates: CoordinatesZ,
	rating: z.number().min(0).max(5),
	reviews: z.array(z.lazy(() => ReviewZ)),
	icon: z.enum(availableEmojis),
	createdBy: UUID,
	dietaryInfo: DietaryInfoZ
});
export type Restaurant = z.infer<typeof RestaurantZ>;
export const NewRestaurantZ = RestaurantZ.pick({
	name: true,
	coordinates: true,
	createdBy: true
});
export type NewRestaurant = z.infer<typeof NewRestaurantZ>;

// Bookmark list
export const ListZ = z.object({
	id: UUID,
	name: z.string().max(20),
	description: z.string().max(200).optional(),
	createdAt: z.date(),
	restaurants: z.array(RestaurantZ),
	createdBy: UUID,
	icon: z.enum(availableEmojis)
});
export type List = z.infer<typeof ListZ>;
export const NewListZ = ListZ.omit({ id: true, createdAt: true, restaurants: true }).extend({
	icon: ListZ.shape.icon.optional()
});
export type NewList = z.infer<typeof NewListZ>;

// User
export const UserZ = z.object({
	id: UUID,
	username: z.string().min(3).max(30),
	passwordHash: z.string(),
	createdAt: DateZ
});
export type User = z.infer<typeof UserZ>;

export type OKLCHColor = `oklch(${number}% ${number} ${number})`;
