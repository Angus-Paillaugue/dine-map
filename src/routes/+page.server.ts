import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
	const { user } = locals;
	if (user) {
		return redirect(303, '/app');
	} else {
		return redirect(303, '/auth/log-in');
	}
}) satisfies PageServerLoad;
