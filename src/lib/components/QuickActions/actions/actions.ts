import type { OKLCHColor, Restaurant } from '$lib/types';
import { DIETARY_INFO_DISPLAY } from '$lib/utils';
import { randomFromArray, type QuickAction } from '.';
import Globals from '$lib/globals.svelte';
import { getDistance } from 'ol/sphere';

import { vegetarian, random, halal, notHalal } from './registry.svelte';

export class NearMeAction implements QuickAction {
	public id = 'near-me';
	public name = 'Near Me';
	public color = 'oklch(68.1% 0.162 75)' as OKLCHColor;
	public index = 100;

	onClick(restaurants: Restaurant[]) {
		const n = 5; // Number of nearest restaurants to return
		const userPos = Globals.getCurrentUserPosition();
		const sorted = restaurants
			.map((restaurant) => {
				const distance = getDistance(userPos, restaurant.coordinates);
				return { restaurant, distance };
			})
			.sort((a, b) => a.distance - b.distance)
			.slice(0, n);
		return sorted.map(({ restaurant, distance }) => ({
			restaurant,
			trailing: { snippet: random, params: [distance] }
		}));
	}
}

export class RandomAction implements QuickAction {
	public id = 'random';
	public name = "Destiny's Call";
	public color = 'oklch(60.6% 0.25 292)' as OKLCHColor;
	public index = 200;

	onClick(restaurants: Restaurant[]) {
		const randomRestaurant = randomFromArray(restaurants);
		Globals.restaurantDetailsId = randomRestaurant.id;
	}
}

export class HalalAction implements QuickAction {
	public id = 'halal';
	public name = 'Halal';
	public color = DIETARY_INFO_DISPLAY.halal.color;
	public index = 300;

	onClick(restaurants: Restaurant[]) {
		const halalRestaurants = restaurants.filter((restaurant) => restaurant.dietaryInfo.halal);
		if (halalRestaurants.length === 0) {
			alert('No halal restaurants found!');
			return;
		}
		return halalRestaurants.map((restaurant) => ({
			restaurant,
			trailing: { snippet: halal, params: [] }
		}));
	}
}

export class VegetarianAction implements QuickAction {
	public id = 'vegetarian';
	public name = 'Vegetarian';
	public color = DIETARY_INFO_DISPLAY.vegetarian.color;
	public index = 400;

	onClick(restaurants: Restaurant[]) {
		const vegetarianRestaurants = restaurants.filter(
			(restaurant) => restaurant.dietaryInfo.vegetarian
		);
		if (vegetarianRestaurants.length === 0) {
			alert('No vegetarian restaurants found!');
			return;
		}
		return vegetarianRestaurants.map((restaurant) => ({
			restaurant,
			trailing: { snippet: vegetarian, params: [] }
		}));
	}
}

export class NotHalalAction implements QuickAction {
	public id = 'not-halal';
	public name = 'Not Halal';
	public color = DIETARY_INFO_DISPLAY.halal.color;
	public index = 500;

	onClick(restaurants: Restaurant[]) {
		const halalRestaurants = restaurants.filter((restaurant) => !restaurant.dietaryInfo.halal);
		if (halalRestaurants.length === 0) {
			alert('No halal restaurants found!');
			return;
		}
		return halalRestaurants.map((restaurant) => ({
			restaurant,
			trailing: { snippet: notHalal, params: [] }
		}));
	}
}
