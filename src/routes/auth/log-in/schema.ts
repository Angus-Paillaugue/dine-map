import { defs } from '$lib/utils';
import { z } from 'zod';

export const formSchema = z.object({
	username: defs.username,
	password: defs.password,
	rememberMe: defs.checkbox.optional().default(true)
});
export type FormSchema = typeof formSchema;
