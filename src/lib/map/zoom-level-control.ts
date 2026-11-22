import ZoomIndicator from '#lib/components/ZoomIndicator.svelte';
import { SvelteControl } from './svelte-control.js';

/** Shows the current zoom level of the map. */
export class ZoomLevelControl extends SvelteControl {
	constructor() {
		super(ZoomIndicator);
	}
}
