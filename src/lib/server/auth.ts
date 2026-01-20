import { env } from '$env/dynamic/private';
import type { User, UUID } from '$lib/types';
import jwt from 'jsonwebtoken';
import { UserDAO } from '$lib/server/db/UserDAO';
import { logger } from '$lib/utils/logger';

/**
 * Authenticates a user based on the provided JWT token.
 */
async function auth(token: string): Promise<User | null> {
	return new Promise((resolve, reject) => {
		if (!token) reject({ error: 'No token was provided!' });
		try {
			jwt.verify(token, env.JWT_SECRET as string, async (err, decoded: unknown) => {
				if (err) return reject(err);
				try {
					const user = await UserDAO.getUserById(decoded as UUID);
					resolve(user);
				} catch (error) {
					logger.error('User not found:', error);
					reject('User not found');
				}
			});
		} catch (error) {
			logger.error('Error verifying token:', error);
			reject({ error: 'Error verifying token' });
		}
	});
}

function generateAccessToken(id: User['id']): string {
	return jwt.sign(id, env.JWT_SECRET as string);
}

export { auth, generateAccessToken };
