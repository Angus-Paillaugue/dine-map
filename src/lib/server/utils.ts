import { env } from '$env/dynamic/private';

export const getEnv = (key: string, defaultValue: string) => {
	return env[key] || defaultValue;
};

export const getCookiePrefix = (name?: string) => {
	return getEnv('COOKIE_PREFIX', 'outfitter') + '_' + (name ?? '');
};
