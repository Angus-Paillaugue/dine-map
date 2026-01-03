import { RestaurantNameMaxLength, type Coordinates } from '$lib/types';
import path from 'node:path';
import { ListDAO } from './db/ListDAO';
import { RestaurantDAO } from './db/RestaurantDAO';
import { isSamePlace } from '$lib/utils';

async function extractFromCSVContents(CSVContent: string) {
	const columns = ['title', 'note', 'url', 'tags', 'comments'];
	const lines = CSVContent.split('\n')
		.slice(2)
		.filter((line) => line.trim() !== '');
	const items = lines.map((line) => {
		const values = line.split(',').map((value) => value.replace(/^"|"$/g, '').trim());
		const item: Record<string, string> = {};
		columns.forEach((col, index) => {
			item[col] = values[index] || '';
		});
		return item;
	});
	const result: { name: string; coordinates: Coordinates }[] = [];
	for (const item of items) {
		const { title, url } = item;
		const res = await fetch(url);
		const content = await res.text();
		const urlRegex = new RegExp(/APP_INITIALIZATION_STATE=\[\[\[\d+\.\d+,([\d.]+),([\d.]+)/);
		const redirectUrl = content.match(urlRegex);
		if (redirectUrl) {
			const lat = parseFloat(redirectUrl[1]);
			const lng = parseFloat(redirectUrl[2]);
			result.push({ name: title.slice(0, RestaurantNameMaxLength), coordinates: [lat, lng] });
		}
	}

	return result;
}

export async function importListFromTakeout(file: File) {
	const CSVContent = await file.text();
	const listName = path.basename(file.name, path.extname(file.name)).slice(0, 20);
	const items = await extractFromCSVContents(CSVContent);
	const restaurantIds: string[] = [];
	const allRestaurants = await RestaurantDAO.getAllRestaurants();
	for (const item of items) {
		for (const existingRestaurant of allRestaurants) {
			if (isSamePlace(existingRestaurant.coordinates, item.coordinates)) {
				restaurantIds.push(existingRestaurant.id);
				continue;
			}
		}
		const restaurant = await RestaurantDAO.createRestaurant({
			name: item.name,
			coordinates: item.coordinates
		});
		restaurantIds.push(restaurant.id);
	}
	const listExists = await ListDAO.getListByName(listName);
	let listId: string;
	if (!listExists) {
		// Add items to existing list
		const newList = await ListDAO.createList({
			name: listName
		});
		listId = newList.id;
	} else {
		listId = listExists.id;
	}
	for (const restaurantId of restaurantIds) {
		await ListDAO.addRestaurantToList(restaurantId, listId);
	}
	return listName;
}
