import z from 'zod';
import {
	availableEmojis as availableEmojisList,
	type AvailableEmoji as AvailableEmojiType
} from './emoji.js';
import type OlMap from 'ol/Map';

export const UUIDZ = z.uuid();
export type UUID = z.infer<typeof UUIDZ>;

export const CoordinatesZ = z.tuple([z.number(), z.number()]); // [longitude, latitude]
export type Coordinates = z.infer<typeof CoordinatesZ>;

export const ViewboxZ = z.tuple([z.number(), z.number(), z.number(), z.number()]); // [Top-Left Lon, Top-Left Lat, Bottom-Right Lon, Bottom-Right Lat]
export type Viewbox = z.infer<typeof ViewboxZ>;

// Emojis
export const availableEmojis = availableEmojisList;
export type AvailableEmojis = AvailableEmojiType;

// Review
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
	id: UUIDZ,
	name: z.string().max(RestaurantNameMaxLength),
	coordinates: CoordinatesZ,
	rating: z.number().min(0).max(5),
	reviews: z.array(z.lazy(() => ReviewZ)),
	icon: z.enum(availableEmojis),
	dietaryInfo: DietaryInfoZ
});
export type Restaurant = z.infer<typeof RestaurantZ>;
export const NewRestaurantZ = RestaurantZ.omit({
	id: true,
	reviews: true,
	rating: true,
	icon: true
});
export type NewRestaurant = z.infer<typeof NewRestaurantZ>;

// Bookmark list
export const ListZ = z.object({
	id: UUIDZ,
	name: z.string().max(20),
	description: z.string().max(200).optional(),
	createdAt: z.date(),
	restaurants: z.array(RestaurantZ),
	icon: z.enum(availableEmojis)
});
export type List = z.infer<typeof ListZ>;
export const NewListZ = ListZ.omit({ id: true, createdAt: true, restaurants: true }).extend({
	icon: ListZ.shape.icon.optional()
});
export type NewList = z.infer<typeof NewListZ>;

// Main page related types
export const MapCtxKey = 'mapCtx';
export interface MapCtx {
	resetMapView: () => void;
	getMap: () => OlMap | null;
}
