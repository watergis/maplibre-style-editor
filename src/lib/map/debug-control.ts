import MapDebugControls from '#lib/components/MapDebugControls.svelte';
import { SvelteControl } from './svelte-control.js';

/** Switches for the debug options of the map: tile boundaries and collision boxes. */
export class DebugControl extends SvelteControl {
	constructor() {
		super(MapDebugControls);
	}
}
