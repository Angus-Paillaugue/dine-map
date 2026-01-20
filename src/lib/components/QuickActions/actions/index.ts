import type { OKLCHColor, Restaurant } from '$lib/types';
import type { Snippet } from 'svelte';
import * as Actions from './actions';

export type ActionReturn = {
	restaurant: Restaurant;
	trailing: { snippet: Snippet<[never]>; params: unknown[] };
};

export abstract class QuickAction {
	public abstract id: string;
	public abstract name: string;
	public abstract color: OKLCHColor;
	public abstract index: number;

	public abstract onClick(restaurants: Restaurant[]): void | ActionReturn[];
}

export const randomFromArray = <T>(array: T[]): T => {
	// Overly complicated way to get a random index, but crypto is more secure than Math.random :)
	const arrayBuffer = new Uint32Array(1);
	crypto.getRandomValues(arrayBuffer);
	const randomIndex = arrayBuffer[0] % array.length;
	return array[randomIndex];
};

export const QUICK_ACTIONS: Array<QuickAction> = Object.values(Actions)
	.map((Action) => new Action())
	.sort((a, b) => a.index - b.index);
