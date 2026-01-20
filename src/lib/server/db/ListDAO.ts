import type { Restaurant, UUID, NewList, List, AvailableEmojis, User } from '$lib/types';
import { sql } from 'bun';
import { RestaurantDAO } from './RestaurantDAO';

interface ListTable {
	id: UUID;
	name: string;
	description: string;
	icon: AvailableEmojis;
	created_at: string;
	created_by: User['id'];
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
			createdBy: row.created_by,
			icon: row.icon
		};
	}

	static async checkOwnership(listId: List['id'], userId: User['id']): Promise<boolean> {
		const [listRow] = await sql<ListTable[]>`
			SELECT l.id
			FROM "list" l
			WHERE l.id = ${listId} AND l.created_by = ${userId}
		`;
		return !!listRow;
	}

	static async createList(list: NewList): Promise<List> {
		const rows: { key: keyof NewList; equivalent: string }[] = [
			{ key: 'name', equivalent: 'name' },
			{ key: 'description', equivalent: 'description' },
			{ key: 'createdBy', equivalent: 'created_by' }
		];
		if (list.icon) {
			rows.push({ key: 'icon', equivalent: 'icon' });
		}
		const [l] = await sql.unsafe(
			`
				INSERT INTO "list" (${rows.map((r) => r.equivalent).join(', ')})
				VALUES (${rows.map((_, i) => '$' + (i + 1)).join(', ')})
				RETURNING *
    `,
			rows.map((r) => list[r.key])
		);
		return this.convertToList(l);
	}

	static async getListById(id: List['id']): Promise<List | null> {
		const [listRow] = await sql<ListTable[]>`
			SELECT l.*
			FROM "list" l
			WHERE l.id = ${id}
		`;
		if (!listRow) {
			return null;
		}
		const restaurantRows = await sql<BelongsInListTable[]>`
			SELECT restaurant_id
			FROM "belongs_in_list"
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

	static async getAllLists(userId: User['id']): Promise<List[]> {
		const listRows = await sql<ListTable[]>`
			SELECT l.*
			FROM "list" l
			LEFT JOIN (
				SELECT list_id, MAX(added_at) AS latest_item
				FROM belongs_in_list
				GROUP BY list_id
			) i ON l.id = i.list_id
			WHERE l.created_by = ${userId}
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
			INSERT INTO "belongs_in_list" (list_id, restaurant_id)
			VALUES (${listId}, ${restaurantId})
			ON CONFLICT DO NOTHING
		`;
	}

	static async removeRestaurantFromList(
		restaurantId: Restaurant['id'],
		listId: List['id']
	): Promise<void> {
		await sql`
			DELETE FROM "belongs_in_list"
			WHERE list_id = ${listId} AND restaurant_id = ${restaurantId}
		`;
	}

	static async updateList(id: List['id'], updates: Partial<List>): Promise<List | null> {
		const [updatedRow] = await sql<ListTable[]>`
			UPDATE "list"
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
			DELETE FROM "list" l
			WHERE l.id = ${id}
		 `;
	}

	static async getListByName(name: List['name'], userId: User['id']): Promise<List | null> {
		const [listRow] = await sql<ListTable[]>`
			SELECT l.*
			FROM "list" l
			WHERE l.name = ${name}
			AND l.created_by = ${userId}
		`;
		if (!listRow) {
			return null;
		}
		return this.getListById(listRow.id);
	}
}
