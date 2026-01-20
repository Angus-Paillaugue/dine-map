import type { User } from '$lib/types';
import { sql } from 'bun';

interface UserTable {
	id: string;
	username: string;
	password_hash: string;
	created_at: string;
}

export class UserDAO {
	static convertToUser(row: UserTable): User {
		return {
			id: row.id,
			username: row.username,
			passwordHash: row.password_hash,
			createdAt: new Date(row.created_at)
		};
	}

	static async createUser(
		username: User['username'],
		passwordHash: User['passwordHash']
	): Promise<User> {
		const [u] = await sql`
			INSERT INTO "user" (username, password_hash)
			VALUES (${username}, ${passwordHash})
			RETURNING *
		`;
		return this.convertToUser(u);
	}

	static async getUserById(id: User['id']): Promise<User | null> {
		const [userRow] = await sql<UserTable[]>`
			SELECT *
			FROM "user"
			WHERE id = ${id}
		`;
		if (!userRow) {
			return null;
		}
		return this.convertToUser(userRow);
	}

	static async getUserByUsername(username: User['username']): Promise<User | null> {
		const [userRow] = await sql<UserTable[]>`
			SELECT id
			FROM "user"
			WHERE username = ${username}
		`;
		if (!userRow) {
			return null;
		}
		const user = await this.getUserById(userRow.id);
		return user;
	}
}
