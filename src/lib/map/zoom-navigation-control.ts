import { NavigationControl, type Map as MaplibreMap } from 'maplibre-gl';

/** The navigation control of MapLibre, with the current zoom level shown above the zoom buttons. */
export class ZoomNavigationControl extends NavigationControl {
	#map: MaplibreMap | undefined;
	#label: HTMLDivElement | undefined;

	#update = () => {
		if (this.#map && this.#label) this.#label.textContent = this.#map.getZoom().toFixed(1);
	};

	override onAdd(map: MaplibreMap): HTMLElement {
		const container = super.onAdd(map);
		// Text, not a button: sized like the zoom buttons in layout.css.
		const label = document.createElement('div');
		label.className = 'maplibregl-ctrl-zoom-level';
		label.title = 'Current zoom level';
		label.setAttribute('aria-label', 'Current zoom level');
		container.insertBefore(label, container.firstChild);
		this.#map = map;
		this.#label = label;
		this.#update();
		map.on('zoom', this.#update);
		return container;
	}

	override onRemove(): void {
		this.#map?.off('zoom', this.#update);
		this.#label?.remove();
		this.#map = undefined;
		this.#label = undefined;
		super.onRemove();
	}
}
