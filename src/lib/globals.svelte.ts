import type { List, Restaurant, Viewbox } from './types';

class GlobalsClass {
	restaurantDetailsId = $state<Restaurant['id'] | null>(null);
	toggleList = $state<Restaurant['id'] | null>(null);
	manageLists = $state(false);
	mapFilterList = $state<List['id'][]>([]);
	viewBox = $state<Viewbox | null>(null);
	showRouteToPoi = $state<(poi: Restaurant) => Promise<void>>(async () => {});
}

const Globals = new GlobalsClass();
export default Globals;
