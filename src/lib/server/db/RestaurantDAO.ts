import type { NewRestaurant, Restaurant, Review, UUID } from '$lib/types';
import { sql } from 'bun';
import { fromPgCoordinates, toPgCoordinates } from './utils';
import { getRestaurantRating } from '$lib/utils';
import { ReviewDAO } from './ReviewDAO';

interface RestaurantTable {
	id: UUID;
	name: string;
	coordinates: string;
}

export class RestaurantDAO {
	static convertToRestaurant(row: RestaurantTable, reviews: Review[] = []): Restaurant {
		return {
			id: row.id,
			name: row.name,
			coordinates: fromPgCoordinates(row.coordinates),
			rating: reviews ? getRestaurantRating(reviews) : 0,
			reviews
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
		return this.convertToRestaurant(restaurant, reviews);
	}

	static async createRestaurant(restaurant: NewRestaurant): Promise<Restaurant> {
		const [r] = await sql<RestaurantTable[]>`
      INSERT INTO restaurant (name, coordinates)
      VALUES (${restaurant.name}, ${toPgCoordinates(restaurant.coordinates)})
      RETURNING *
    `;
		return this.convertToRestaurant(r);
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
}
