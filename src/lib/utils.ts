import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AvailableEmojis, Coordinates, Review } from './types';
import { getDistance } from 'ol/sphere';
import { Style as OlStyle, Text as OlText, Fill as OlFill } from 'ol/style';
import { createIconStyle } from 'svelte-openlayers/utils';
import { tick } from 'svelte';

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

export const formatDuration = (durationInSeconds: number): string => {
	const hours = Math.floor(durationInSeconds / 3600);
	const minutes = Math.ceil((durationInSeconds % 3600) / 60);

	if (hours > 0) {
		return `${hours} hr${hours > 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`;
	} else {
		return `${minutes} min${minutes !== 1 ? 's' : ''}`;
	}
};

export const formatDistance = (distanceInMeters: number): string => {
	const kms = distanceInMeters / 1000;
	if (kms >= 1) {
		return `${kms.toFixed(2)} km`;
	} else {
		return `${distanceInMeters.toFixed(0)} m`;
	}
};

export function emojiToSvgDataUrl({
	emoji,
	name,
	size = 40,
	bgColor = tailwindVarValue('secondary'),
	fgColor = tailwindVarValue('foreground'),
	fontFamily
}: {
	emoji: AvailableEmojis;
	name?: string;
	size?: number;
	bgColor?: string;
	fgColor?: string;
	fontFamily?: string;
}): OlStyle[] {
	const MAX_NAME_LENGTH = 15;
	const backgroundShape = {
		path: `M90.766769,39.265259 C97.762024,47.749290 98.108978,49.246719 90.987701,56.797691 C85.971191,62.116913 84.729431,68.211296 84.348335,74.945038 C83.974213,81.555687 81.747330,84.088058 75.250893,84.298790 C67.080544,84.563820 60.163528,86.846245 54.409271,93.102676 C50.508568,97.343773 47.127373,96.978500 42.475681,93.416969 C42.211239,93.214493 41.916458,93.032265 41.705814,92.781738 C36.373421,86.439674 29.300461,84.569885 21.336117,84.281181 C15.089928,84.054756 12.710197,82.114311 12.522160,75.773750 C12.265385,67.115570 9.428520,60.213737 3.308998,54.054176 C-0.718903,49.999916 -0.481825,46.279480 3.597279,42.110588 C9.096550,36.490273 12.203491,30.491096 12.218548,22.284496 C12.232769,14.535179 15.083176,11.996582 23.320614,12.044178 C30.632751,12.086430 35.958794,9.458595 40.959534,4.511442 C46.212074,-0.684814 49.929016,-0.801180 55.282188,4.229691 C60.615944,9.242306 66.130562,12.175220 73.820213,12.104065 C81.931335,12.029003 83.873245,14.798851 84.378731,22.774895 C84.760406,28.797501 85.293434,34.795418 90.766769,39.265259 z`,
		viewBox: `0 0 97 97`
	};
	const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${backgroundShape.viewBox}">
		<path d="${backgroundShape.path}" fill="${bgColor}" />
		<text x="50%" y="50%" font-size="${size}" text-anchor="middle" dominant-baseline="central" font-family="${fontFamily ?? 'Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,Segoe UI Symbol'}" fill="${fgColor}">${emoji}</text>
	</svg>`;
	const style = createIconStyle({
		src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(icon)}`,
		scale: 1,
		anchor: [0.5, 0.5],
		anchorXUnits: 'fraction',
		anchorYUnits: 'fraction'
	});
	console.log(
		'clusterStyle',
		icon,
		createIconStyle({
			src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(icon)}`,
			scale: 1,
			anchor: [0.5, 0.5],
			anchorXUnits: 'fraction',
			anchorYUnits: 'fraction'
		})
	);
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
	const nbPOIs = feature.get('features').length;

	if (nbPOIs === 1) {
		const restaurant = feature.get('features')[0].get('restaurant');
		return emojiToSvgDataUrl({
			emoji: restaurant.icon,
			size: 40,
			name: restaurant.name
		});
	}

	const size = 34;
	const svgSize = 84;
	const fontSize = svgSize * 0.4;
	const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${svgSize} ${svgSize + 3}"><path d="M2.3594 39.3093C2.6476 27.6279 7.3734 19.2 17.2915 13.4923 22.1732 10.683 26.4621 6.8621 31.1428 3.6808 38.2262-1.1335 45.557-1.2571 52.6259 3.5583 59.6418 8.3375 66.7675 13.0717 73.1333 18.6394 76.2864 21.3972 78.9365 25.7264 79.8902 29.7956 81.8959 38.3528 82.8798 47.1812 83.8189 55.9479 84.7644 64.7747 81.0892 71.0309 73.0074 74.8934 65.351 78.5525 57.5697 81.9542 49.8001 85.3708 44.6684 87.6274 39.4401 87.6667 34.2836 85.3964 26.6679 82.0434 19.0221 78.7498 11.4967 75.2027 2.465 70.9455-1.0766 64.0942.2879 54.074.9393 49.2902 1.6837 44.519 2.4436 39.3093z" fill="${tailwindVarValue('secondary')}" /><text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="${fontSize}" font-weight="bold" font-family="${tailwindVarValue('font-sans').replaceAll('"', "'")}"  fill="${tailwindVarValue('foreground')}">${String(nbPOIs)}</text></svg>`;
	return createIconStyle({
		src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(icon)}`,
		scale: 1,
		anchor: [0.5, 0.5],
		anchorXUnits: 'fraction',
		anchorYUnits: 'fraction'
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

export function portal(el: HTMLElement, target?: HTMLElement | string) {
	target ??= 'body';
	let targetEl: HTMLElement | null = null;

	// Temporarily hide the element to prevent layout shift
	el.style.position = 'absolute';
	el.style.opacity = '0';
	el.style.pointerEvents = 'none';

	async function update(newTarget: HTMLElement | string) {
		target = newTarget;
		if (typeof target === 'string') {
			targetEl = document.querySelector(target);
			if (targetEl === null) {
				await tick();
				targetEl = document.querySelector(target);
			}
			if (targetEl === null) {
				throw new Error(`No element found matching css selector: "${target}"`);
			}
		} else if (target instanceof HTMLElement) {
			targetEl = target;
		} else {
			throw new TypeError(
				`Unknown portal target type: ${
					target === null ? 'null' : typeof target
				}. Allowed types: string (CSS selector) or HTMLElement.`
			);
		}

		// Append the element to the target and restore its visibility
		targetEl.appendChild(el);
		el.style.position = '';
		el.style.opacity = '';
		el.style.pointerEvents = '';
		el.hidden = false;
	}

	function destroy() {
		if (el.parentNode) {
			el.parentNode.removeChild(el);
		}
	}

	update(target);
	return {
		update,
		destroy
	};
}
