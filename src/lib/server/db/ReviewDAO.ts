import type { Restaurant, Review, UUID, NewReview } from '$lib/types';
import { sql } from 'bun';

interface ReviewTable {
	id: UUID;
	restaurant_id: UUID;
	rating: number;
	comment: string;
	created_at: string;
}

export class ReviewDAO {
	static convertToReview(row: ReviewTable): Review {
		return {
			id: row.id,
			rating: row.rating,
			comment: row.comment,
			restaurantId: row.restaurant_id,
			date: new Date(row.created_at)
		};
	}

	static async getReviewsForRestaurant(restaurantId: Restaurant['id']): Promise<Review[]> {
		const reviews = await sql<ReviewTable[]>`
      SELECT *
      FROM review
      WHERE restaurant_id = ${restaurantId}
			ORDER BY created_at DESC
    `;
		return reviews.map(this.convertToReview);
	}

	static async getReviewById(id: Review['id']): Promise<Review | null> {
		const [review] = await sql<ReviewTable[]>`
      SELECT *
      FROM review
      WHERE id = ${id}
    `;
		if (!review) {
			return null;
		}
		return this.convertToReview(review);
	}

	static async createReview(review: NewReview): Promise<Review> {
		const [r] = await sql`
      INSERT INTO review (restaurant_id, rating, comment)
      VALUES (${review.restaurantId}, ${review.rating}, ${review.comment})
      RETURNING *
    `;
		return this.convertToReview(r);
	}

	static async deleteReview(id: Review['id']): Promise<void> {
		await sql`
      DELETE FROM review
      WHERE id = ${id}
    `;
	}

	static async updateReview(id: Review['id'], review: Partial<NewReview>): Promise<Review | null> {
		const fields = Object.keys(review) as (keyof NewReview)[];
		if (fields.length === 0) {
			return this.getReviewById(id);
		}
		const [r] = await sql<ReviewTable[]>`UPDATE users SET ${sql(review)} WHERE id = ${id}`;
		if (!r) {
			return null;
		}
		return this.convertToReview(r);
	}
}
