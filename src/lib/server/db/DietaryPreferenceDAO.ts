import type { DietaryInfo, UUID } from '$lib/types';
import { sql } from 'bun';

interface DietaryTable {
	id: UUID;
	restaurant_id: UUID;
	type: string;
	is_available: boolean;
}

export class DietaryPreferenceDAO {
	static async setPreferences(id: UUID, prefs: DietaryInfo): Promise<void> {
		const data = Object.entries(prefs)
			.map(([type, is_available]) => ({
				restaurant_id: id,
				type,
				is_available
			}))
			.filter((entry) => entry.is_available === true);
		await sql`INSERT INTO dietary_preference ${sql(data)} ON CONFLICT (restaurant_id, type) DO UPDATE SET is_available = EXCLUDED.is_available`;
	}

	static async getPreferencesForRestaurant(id: UUID): Promise<DietaryInfo | null> {
		const rows = await sql<DietaryTable[]>`
      SELECT *
      FROM dietary_preference
      WHERE restaurant_id = ${id} AND is_available = true
    `;
		const prefs: DietaryInfo = {
			halal: false,
			vegan: false,
			vegetarian: false,
			kosher: false
		};
		for (const row of rows) {
			if (row.type in prefs) {
				prefs[row.type as keyof DietaryInfo] = row.is_available;
			}
		}
		return prefs;
	}
}

export default DietaryPreferenceDAO;
