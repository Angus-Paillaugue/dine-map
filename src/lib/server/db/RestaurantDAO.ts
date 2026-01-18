import type { DietaryInfo, NewRestaurant, Restaurant, Review, UUID } from '$lib/types';
import { sql } from 'bun';
import { fromPgCoordinates, toPgCoordinates } from './utils';
import { getRestaurantRating } from '$lib/utils';
import { ReviewDAO } from './ReviewDAO';
import { microserviceManager } from '../microservices';
import DietaryPreferenceDAO from './DietaryPreferenceDAO';

interface RestaurantTable {
	id: UUID;
	name: string;
	coordinates: string;
	icon: Restaurant['icon'];
}

export class RestaurantDAO {
	static convertToRestaurant(
		row: RestaurantTable,
		otherData?: { reviews?: Review[]; dietaryInfo?: DietaryInfo }
	): Restaurant {
		const { reviews = [], dietaryInfo } = otherData || {};
		return {
			id: row.id,
			name: row.name,
			coordinates: fromPgCoordinates(row.coordinates),
			rating: reviews.length ? getRestaurantRating(reviews) : 0,
			reviews: reviews,
			icon: row.icon,
			dietaryInfo
		};
	}

	static async getRestaurantById(id: Restaurant['id']): Promise<Restaurant | null> {
		const [restaurant] = await sql<RestaurantTable[]>`
			SELECT *
			FROM restaurant
			WHERE id = ${id}
    `;
		if (!restaurant) {
			return null;
		}
		const reviews = await ReviewDAO.getReviewsForRestaurant(id);
		const dietaryInfo = (await DietaryPreferenceDAO.getPreferencesForRestaurant(id)) || undefined;
		return this.convertToRestaurant(restaurant, { reviews, dietaryInfo });
	}

	static async createRestaurant(restaurant: NewRestaurant): Promise<Restaurant> {
		const [r] = await sql<RestaurantTable[]>`
      INSERT INTO restaurant (name, coordinates)
      VALUES (${restaurant.name}, ${toPgCoordinates(restaurant.coordinates)})
      RETURNING *
    `;
		const createdRestaurant = this.convertToRestaurant(r);
		microserviceManager.process(createdRestaurant, ['dietary-preference']);
		return createdRestaurant;
	}

	static async getAllRestaurants(): Promise<Restaurant[]> {
		const restaurantIds = await sql<RestaurantTable['id'][]>`
      SELECT id
      FROM restaurant
    `.values();
		const restaurantList: (Restaurant | null)[] = [];
		for (const restaurantId of restaurantIds)
			restaurantList.push(await this.getRestaurantById(restaurantId));

		return restaurantList.filter((r): r is Restaurant => r !== null);
	}

	static async updateRestaurant(
		id: Restaurant['id'],
		updates: Partial<Restaurant>
	): Promise<Restaurant | null> {
		const [updatedRow] = await sql<RestaurantTable[]>`
			UPDATE restaurant
			SET ${sql(updates, 'name', 'icon')}
			WHERE id = ${id}
			RETURNING *
		`;

		if (!updatedRow) {
			return null;
		}
		return this.getRestaurantById(updatedRow.id);
	}

	static async deleteRestaurant(id: Restaurant['id']): Promise<void> {
		await sql`
			DELETE FROM restaurant
			WHERE id = ${id}
		`;
	}
}
