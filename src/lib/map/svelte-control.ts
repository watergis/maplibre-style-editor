import { mount, unmount, type Component } from 'svelte';
import type { IControl, Map as MaplibreMap } from 'maplibre-gl';

/** A MapLibre control that shows a Svelte component, given the map as its `map` prop. */
export class SvelteControl implements IControl {
	#container: HTMLDivElement | undefined;
	#app: Record<string, unknown> | undefined;

	constructor(private readonly component: Component<{ map: MaplibreMap }>) {}

	onAdd(map: MaplibreMap): HTMLElement {
		const container = document.createElement('div');
		container.className = 'maplibregl-ctrl';
		this.#app = mount(this.component, { target: container, props: { map } });
		this.#container = container;
		return container;
	}

	onRemove(): void {
		if (this.#app) void unmount(this.#app);
		this.#app = undefined;
		this.#container?.remove();
		this.#container = undefined;
	}
}
