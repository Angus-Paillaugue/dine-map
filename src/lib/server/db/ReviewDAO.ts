import type { Restaurant, Review, UUID, NewReview, User } from '$lib/types';
import { sql } from 'bun';

interface ReviewTable {
	id: UUID;
	restaurant_id: UUID;
	rating: number;
	comment: string;
	created_at: string;
	created_by: User['id'];
}

export class ReviewDAO {
	static convertToReview(row: ReviewTable): Review {
		return {
			id: row.id,
			rating: row.rating,
			comment: row.comment,
			restaurantId: row.restaurant_id,
			date: new Date(row.created_at),
			createdBy: row.created_by
		};
	}

	static async checkOwnership(reviewId: Review['id'], userId: User['id']): Promise<boolean> {
		const [reviewRow] = await sql<ReviewTable[]>`
			SELECT r.id
			FROM "review" r
			WHERE r.id = ${reviewId} AND r.created_by = ${userId}
		`;
		return !!reviewRow;
	}

	static async getReviewsForRestaurant(restaurantId: Restaurant['id']): Promise<Review[]> {
		const reviews = await sql<ReviewTable[]>`
      SELECT r.*
      FROM "review" r
      WHERE r.restaurant_id = ${restaurantId}
			ORDER BY r.created_at DESC
    `;
		return reviews.map(this.convertToReview);
	}

	static async getReviewById(id: Review['id']): Promise<Review | null> {
		const [review] = await sql<ReviewTable[]>`
      SELECT r.*
      FROM "review" r
      WHERE r.id = ${id}
    `;
		if (!review) {
			return null;
		}
		return this.convertToReview(review);
	}

	static async createReview(review: NewReview): Promise<Review> {
		const [r] = await sql<ReviewTable[]>`
      INSERT INTO "review" (restaurant_id, rating, comment, created_by, created_at)
      VALUES (${review.restaurantId}, ${review.rating}, ${review.comment}, ${review.createdBy}, ${review.date || new Date()})
      RETURNING *
    `;
		return this.convertToReview(r);
	}

	static async deleteReview(id: Review['id']): Promise<void> {
		await sql`
      DELETE FROM "review" r
      WHERE r.id = ${id}
    `;
	}

	static async updateReview(id: Review['id'], updates: Partial<NewReview>): Promise<Review | null> {
		const [updatedRow] = await sql<ReviewTable[]>`
			UPDATE "review"
			SET ${sql(updates, 'comment', 'rating')}
			WHERE id = ${id}
			RETURNING *
		`;

		if (!updatedRow) {
			return null;
		}
		return this.getReviewById(updatedRow.id);
	}
}
