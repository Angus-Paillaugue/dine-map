import { browser, dev } from '$app/environment';
import chalk from 'chalk';

const loggerLevels = ['error', 'warn', 'debug'] as const;

type LoggerLevel = (typeof loggerLevels)[number];
type Logger = { [K in LoggerLevel]: (...args: unknown[]) => void };

export const createLogger = (prefix: string | null, color: string | null): Logger => {
	const defaultColors: Record<LoggerLevel, string> = {
		error: '#dc2626',
		warn: '#ca8a04',
		debug: '#2563eb'
	};
	return Object.fromEntries(
		loggerLevels.map((l) => {
			prefix ??= `[${l}]:`;
			color ??= defaultColors[l];
			const styledPrefix = browser
				? [`%c${prefix}`, `color: ${color}; font-weight: bold;`]
				: [chalk.hex(color).bold(prefix)];
			return [
				l,
				(...args: unknown[]) => {
					// Log everything in dev and only errors in prod
					if (dev || (!dev && loggerLevels.indexOf(l) <= 0)) console[l](...styledPrefix, ...args);
				}
			];
		})
	) as Logger;
};

export const logger = createLogger(null, null);
export const i18nLogger = createLogger('[i18n]:', '#f96743');
