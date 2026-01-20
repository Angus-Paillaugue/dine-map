import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCookiePrefix } from '$lib/server/utils';

export const ssr = false;

export const load = (async ({ locals, cookies }) => {
	delete locals.user;
	cookies.delete(getCookiePrefix('token'), { path: '/' });

	redirect(302, '/auth/log-in');
}) satisfies PageServerLoad;
