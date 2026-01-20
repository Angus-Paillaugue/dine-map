import type { DietaryInfo, Restaurant } from '$lib/types';
import type { Microservice } from '.';
import { DietaryPreferenceDAO } from '$lib/server/db/DietaryPreferenceDAO';

export class DietaryPreferenceMicroservice implements Microservice {
	name = 'dietary-preference';
	maxRetries = 5;

	async call(poi: Restaurant) {
		const [lon, lat] = poi.coordinates;
		const bbox = [lat - 0.00001, lon - 0.00001, lat + 0.00001, lon + 0.00001].join(',');
		const query = `
				[out:json];
				node["amenity"~"restaurant|fast_food|cafe|bar|pub|food_court|ice_cream|biergarten"](${bbox});
				out;
			`;
		const res = await fetch('https://overpass-api.de/api/interpreter', {
			method: 'POST',
			body: 'data=' + encodeURIComponent(query)
		});
		const data = await res.json();
		if (!res.ok) {
			throw new Error(`Overpass API error: ${data.error || res.statusText}`);
		}
		if (!data.elements || data.elements.length === 0) {
			throw new Error('No data found for the given POI from Overpass API');
		}
		const poiData = data.elements[0];
		const tags = poiData.tags;
		const getBoolFromTag = (key: string, shallNotMatch = 'no') => {
			return tags[key] && tags[key] !== shallNotMatch ? true : false;
		};
		const dietTags: DietaryInfo = {
			halal: getBoolFromTag('diet:halal'),
			vegan: getBoolFromTag('diet:vegan'),
			vegetarian: getBoolFromTag('diet:vegetarian'),
			kosher: getBoolFromTag('diet:kosher')
		};

		await DietaryPreferenceDAO.setPreferences(poi.id, dietTags);
	}
}

export const dietaryPreferenceService = new DietaryPreferenceMicroservice();
