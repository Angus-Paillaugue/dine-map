import type { Restaurant, UUID, NewList, List, AvailableEmojis } from '$lib/types';
import { sql } from 'bun';
import { RestaurantDAO } from './RestaurantDAO';

interface ListTable {
	id: UUID;
	name: string;
	description: string;
	icon: AvailableEmojis;
	created_at: string;
}
interface BelongsInListTable {
	list_id: UUID;
	restaurant_id: UUID;
	added_at: string;
}

export class ListDAO {
	static convertToList(row: ListTable, restaurants: Restaurant[] = []): List {
		return {
			id: row.id,
			name: row.name,
			description: row.description,
			createdAt: new Date(row.created_at),
			restaurants,
			icon: row.icon
		};
	}

	static async createList(list: NewList): Promise<List> {
		const rows: (keyof NewList)[] = ['name', 'description'];
		if (list.icon) {
			rows.push('icon');
		}
		const [l] = await sql`
      INSERT INTO list ${sql(list, ...rows)}
      RETURNING *
    `;
		return this.convertToList(l);
	}

	static async getListById(id: List['id']): Promise<List | null> {
		const [listRow] = await sql<ListTable[]>`
			SELECT *
			FROM list
			WHERE id = ${id}
		`;
		if (!listRow) {
			return null;
		}
		const restaurantRows = await sql<BelongsInListTable[]>`
			SELECT restaurant_id
			FROM belongs_in_list
			WHERE list_id = ${id}
		`;
		const restaurantIds = restaurantRows.map((r) => r.restaurant_id);
		const restaurants: Restaurant[] = [];
		for (const restaurantId of restaurantIds) {
			const restaurant = await RestaurantDAO.getRestaurantById(restaurantId);
			if (restaurant) {
				restaurants.push(restaurant);
			}
		}
		return this.convertToList(listRow, restaurants);
	}

	static async getAllLists(): Promise<List[]> {
		const listRows = await sql<ListTable[]>`
			SELECT l.*
			FROM list l
			LEFT JOIN (
				SELECT list_id, MAX(added_at) AS latest_item
				FROM belongs_in_list
				GROUP BY list_id
			) i ON l.id = i.list_id
			ORDER BY i.latest_item DESC NULLS LAST;
		`;
		const lists: (List | null)[] = [];
		for (const listRow of listRows) lists.push(await this.getListById(listRow.id));

		return lists.filter((l): l is List => l !== null);
	}

	static async addRestaurantToList(
		restaurantId: Restaurant['id'],
		listId: List['id']
	): Promise<void> {
		await sql`
			INSERT INTO belongs_in_list (list_id, restaurant_id)
			VALUES (${listId}, ${restaurantId})
			ON CONFLICT DO NOTHING
		`;
	}

	static async removeRestaurantFromList(
		restaurantId: Restaurant['id'],
		listId: List['id']
	): Promise<void> {
		await sql`
			DELETE FROM belongs_in_list
			WHERE list_id = ${listId} AND restaurant_id = ${restaurantId}
		`;
	}

	static async updateList(id: List['id'], updates: Partial<List>): Promise<List | null> {
		const [updatedRow] = await sql<ListTable[]>`
			UPDATE list
			SET ${sql(updates, 'description', 'name', 'icon')}
			WHERE id = ${id}
			RETURNING *
		`;
		if (!updatedRow) {
			return null;
		}
		return this.getListById(updatedRow.id);
	}

	static async deleteList(id: List['id']): Promise<void> {
		await sql`
			DELETE FROM list
			WHERE id = ${id}
		 `;
	}

	static async getListByName(name: List['name']): Promise<List | null> {
		const [listRow] = await sql<ListTable[]>`
			SELECT *
			FROM list
			WHERE name = ${name}
		`;
		if (!listRow) {
			return null;
		}
		return this.getListById(listRow.id);
	}
}
