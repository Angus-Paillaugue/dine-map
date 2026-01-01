import type { Restaurant } from "./types";

class GlobalsClass {
	searchOpen = $state(false);
	restaurantDetailsId = $state<Restaurant['id'] | null>(null);
}


const Globals = new GlobalsClass();
export default Globals;
