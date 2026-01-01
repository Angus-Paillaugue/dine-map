import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Coordinates, Review } from './types';
import { getDistance } from 'ol/sphere';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export function tailwindColorToHex(tailwindColor: string): string {
	// Get the computed styles of the document body
	const styles = getComputedStyle(document.body);

	// Retrieve the CSS variable value for the given Tailwind color
	const cssVariableName = `--${tailwindColor}`;
	const colorValue = styles.getPropertyValue(cssVariableName).trim();

	console.debug(`Converted Tailwind color '${tailwindColor}' to hex value: ${colorValue}`);
	return colorValue || '#FFFFFF';
}

export function getRestaurantRating(reviews: Review[]): number {
	if (reviews.length === 0) return 0;
	const total = reviews.reduce((sum, review) => sum + review.rating, 0);
	return total / reviews.length;
}

export function isSamePlace(
	coord1: Coordinates,
	coord2: Coordinates,
	thresholdInMeters = 5
): boolean {
	const distance = getDistance(coord1, coord2);
	return distance <= thresholdInMeters;
}

export const formatDate = (date: string | Date): string => {
	if (typeof date === 'string') {
		date = new Date(date);
	}
	return date.toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
};
