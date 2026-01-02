import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AvailableEmojis, Coordinates, Review } from './types';
import { getDistance } from 'ol/sphere';
import {
	Style as OlStyle,
	Circle as OlCircle,
	Text as OlText,
	Fill as OlFill,
	Stroke as OlStroke
} from 'ol/style';
import { createIconStyle } from 'svelte-openlayers/utils';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

const stylesCache = new Map<string, string>();
export function tailwindVarValue(tailwindColor: string): string {
	if (stylesCache.has(tailwindColor)) {
		return stylesCache.get(tailwindColor)!;
	}
	// Get the computed styles of the document body
	const styles = getComputedStyle(document.body);

	// Retrieve the CSS variable value for the given Tailwind color
	const cssVariableName = `--${tailwindColor}`;
	const colorValue = styles.getPropertyValue(cssVariableName).trim();

	console.debug(`Converted Tailwind color '${tailwindColor}' to hex value: ${colorValue}`);
	stylesCache.set(tailwindColor, colorValue);
	return colorValue;
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

export function emojiToSvgDataUrl({
	emoji,
	name,
	size = 40,
	bgColor = tailwindVarValue('background')
}: {
	emoji: AvailableEmojis;
	name?: string;
	size?: number;
	bgColor?: string;
	fgColor?: string;
	fontFamily?: string;
}): OlStyle[] {
	const MAX_NAME_LENGTH = 15;
	const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
		<rect width="100%" height="100%" rx="${size / 2}" fill="${bgColor}" />
		<text x="50%" y="50%" font-size="${Math.floor(size * 0.6)}" text-anchor="middle" dominant-baseline="central" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,Segoe UI Symbol">${emoji}</text>
	</svg>
	`;
	const style = createIconStyle({
		src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(icon)}`,
		scale: 1,
		anchor: [0.5, 0.5],
		anchorXUnits: 'fraction',
		anchorYUnits: 'fraction'
	});
	const labelStyle = new OlStyle({
		text: new OlText({
			text:
				(name ?? '').length > MAX_NAME_LENGTH
					? (name ?? '').slice(0, MAX_NAME_LENGTH - 3) + '...'
					: (name ?? ''),
			font: `600 ${Math.floor(size * 0.3)}px ${tailwindVarValue('font-sans')}`,
			fill: new OlFill({ color: tailwindVarValue('foreground') }),
			offsetY: -Math.floor(size * 0.6),
			overflow: true
		})
	});

	return [style, labelStyle];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const clusterStyle = (feature: any) => {
	const size = feature.get('features').length;

	if (size === 1) {
		const restaurant = feature.get('features')[0].get('restaurant');
		return emojiToSvgDataUrl({
			emoji: restaurant.icon,
			size: 40,
			name: restaurant.name
		});
	}

	return new OlStyle({
		image: new OlCircle({
			radius: 14,
			fill: new OlFill({ color: tailwindVarValue('background') }),
			stroke: new OlStroke({ color: tailwindVarValue('foreground'), width: 2 })
		}),
		text: new OlText({
			text: String(size),
			fill: new OlFill({ color: tailwindVarValue('foreground') }),
			font: `bold 12px ${tailwindVarValue('font-sans')}`
		})
	});
};

export const bytesToHumanReadable = (bytes: number): string => {
	const KILOBYTE = 1000;
	const MEGABYTE = 1000 * KILOBYTE;
	const GIGABYTE = 1000 * MEGABYTE;
	if (bytes < KILOBYTE) return `${bytes.toFixed(0)} B`;

	if (bytes < MEGABYTE) return `${(bytes / KILOBYTE).toFixed(0)} KB`;

	if (bytes < GIGABYTE) return `${(bytes / MEGABYTE).toFixed(0)} MB`;

	return `${(bytes / GIGABYTE).toFixed(0)} GB`;
};
