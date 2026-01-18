import type { Restaurant } from '$lib/types';
import { dietaryPreferenceService } from './diet';

export interface Microservice {
	/** Unique service name */
	name: string;
	/** Maximum number of retries (optional) */
	maxRetries?: number;
	/** Execute the microservice for a given POI */
	call(poi: Restaurant): Promise<void>;
}

export class MicroserviceManager {
	private services: Map<string, Microservice> = new Map();
	private concurrency: number;

	constructor(concurrency = 2) {
		this.concurrency = concurrency;
	}

	registerService(service: Microservice) {
		this.services.set(service.name, service);
	}

	unregisterService(name: string) {
		this.services.delete(name);
	}

	hasService(name: string) {
		return this.services.has(name);
	}

	getServices() {
		return Array.from(this.services.keys());
	}

	/**
	 * Process the provided POI with the selected services (all if omitted).
	 * Runs services with limited concurrency and simple retry/backoff.
	 */
	async process(poi: Restaurant, serviceNames?: string[]) {
		const selected =
			serviceNames && serviceNames.length > 0 ? serviceNames : Array.from(this.services.keys());
		const tasks = selected.map((name) => {
			const svc = this.services.get(name);
			if (!svc) {
				return async () => ({ name, success: false, error: `service ${name} not registered` });
			}
			return async () => {
				try {
					await this.runWithRetries(svc, poi);
					return { name, success: true };
				} catch (err) {
					const msg = err instanceof Error ? err.message : String(err);
					return { name, success: false, error: msg };
				}
			};
		});

		const results: Array<{ name: string; success: boolean; error?: string }> = [];

		let i = 0;
		const runNext = async () => {
			const idx = i++;
			if (idx >= tasks.length) return;
			const res = await tasks[idx]();
			results.push(res);
			await runNext();
		};

		const runners = Array(Math.min(this.concurrency, tasks.length))
			.fill(0)
			.map(() => runNext());
		await Promise.all(runners);
		console.log('Microservice processing results for POI', poi.id, results);
		return results;
	}

	private async runWithRetries(svc: Microservice, poi: Restaurant) {
		const max = svc.maxRetries ?? 2;
		let attempt = 0;
		let lastErr: unknown = null;
		while (attempt <= max) {
			try {
				await svc.call(poi);
				return;
			} catch (err) {
				console.error(
					`Microservice ${svc.name} failed on attempt ${attempt + 1} for POI ${poi.id}:`,
					err
				);
				lastErr = err;
				attempt++;
				if (attempt > max) break;
				// simple exponential backoff
				const backoff = Math.min(2000 * 2 ** (attempt - 1), 30_000);
				await new Promise((r) => setTimeout(r, backoff));
			}
		}
		throw lastErr;
	}
}

export const microserviceManager = new MicroserviceManager();
microserviceManager.registerService(dietaryPreferenceService);
