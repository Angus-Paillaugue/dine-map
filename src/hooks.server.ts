import { redirect, type Handle } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { logger, urlStartsWith } from '$lib/utils';
import { getCookiePrefix } from '$lib/server/utils';

const NEED_AUTH_ROUTES: string[] = ['/app', '/api'];

export const handle: Handle = async ({ event, resolve }) => {
	const { url, cookies, locals } = event;

	const token =
		cookies.get(getCookiePrefix('token')) ||
		event.request.headers.get('Authorization')?.replace('Bearer ', '') ||
		null;

	// Check if the user is logged in, and if so, retrieve the user data
	if (token) {
		try {
			const user = await auth(token);
			if (user) {
				locals.user = user;
			} else {
				cookies.delete(getCookiePrefix('token'), { path: '/' });
				delete locals?.user;
			}
		} catch (error) {
			logger.error('Error verifying token:', error);
			delete locals.user;
			cookies.delete(getCookiePrefix('token'), { path: '/' });
		}
	}

	if (!locals.user && urlStartsWith(url.pathname, NEED_AUTH_ROUTES)) {
		// If the user is not logged in and tries to access a protected route, redirect to the login page
		redirect(303, '/auth');
	}

	const response = await resolve(event);
	response.headers.set(
		'X-Robots-Tag',
		urlStartsWith(url.pathname, NEED_AUTH_ROUTES) ? 'noindex, nofollow' : 'index, follow'
	);

	return response;
};
