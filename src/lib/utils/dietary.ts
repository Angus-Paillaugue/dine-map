import type { DietaryInfo, OKLCHColor } from '$lib/types';
import { Gem, LeafyGreen, PiggyBank, Vegan } from '@lucide/svelte';
import type { Component } from 'svelte';

export const DIETARY_INFO_DISPLAY: Record<
	keyof DietaryInfo,
	{ icon: Component; color: OKLCHColor }
> = {
	halal: {
		icon: PiggyBank,
		color: 'oklch(72% 0.17 13)'
	},
	vegan: {
		icon: Vegan,
		color: 'oklch(53% 0.14 150)'
	},
	vegetarian: {
		icon: LeafyGreen,
		color: 'oklch(85% 0.21 129)'
	},
	kosher: {
		icon: Gem,
		color: 'oklch(99% 0 90)'
	}
};
