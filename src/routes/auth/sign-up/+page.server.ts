import { UserDAO } from '$lib/server/db/UserDAO';
import bcrypt from 'bcryptjs';
import type { Actions } from './$types';
import { generateAccessToken } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getCookiePrefix } from '$lib/server/utils';
import { formSchema } from './schema';
import { logger } from '$lib/utils';

export const actions: Actions = {
	signUp: async ({ cookies, request }) => {
		const formData = Object.fromEntries(await request.formData());
		const form = formSchema.safeParse(formData);
		if (!form.success) {
			const errors = form.error.issues.map((err) => ({
				field: err.path[0],
				message: err.message
			}));
			return fail(400, { error: true, errors });
		}

		const { username, password, rememberMe } = form.data;

		const user = await UserDAO.getUserByUsername(username);
		if (user) {
			return fail(400, {
				error: true,
				errors: [{ field: 'username', message: 'An account with that username already exists' }]
			});
		}
		try {
			const salt = await bcrypt.genSalt(10);
			const hash = await bcrypt.hash(password, salt);
			const createdUser = await UserDAO.createUser(username, hash);
			cookies.set(getCookiePrefix('token'), generateAccessToken(createdUser.id), {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: env.NODE_ENV === 'production',
				maxAge: rememberMe ? 60 * 60 * 24 * 30 : undefined // 30 days if rememberMe is true
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			logger.error('Error creating user account :', message);
			return fail(400, {
				error: true,
				message
			});
		}
		redirect(303, '/app');
	}
};
