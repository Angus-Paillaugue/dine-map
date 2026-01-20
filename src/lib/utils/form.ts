import z from 'zod';

export const defs = {
	email: z.email('Invalid email address'),
	username: z
		.string('Username is required')
		.min(3, 'Username must be at least 3 characters long')
		.max(20, 'Username must be at most 20 characters long'),
	password: z.string('Password is required').min(8, 'Password must be at least 8 characters long'),
	checkbox: z.string().transform((value) => value === 'on')
};
