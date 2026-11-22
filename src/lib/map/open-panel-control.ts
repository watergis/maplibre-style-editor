import type { IControl } from 'maplibre-gl';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** The Lucide icon `file-pen`. */
const ICON_PATHS = [
	'M12.659 22H18a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v9.34',
	'M14 2v5a1 1 0 0 0 1 1h5',
	'M10.378 12.622a1 1 0 0 1 3 3.003L8.36 20.637a2 2 0 0 1-.854.506l-2.867.837a.5.5 0 0 1-.62-.62l.836-2.869a2 2 0 0 1 .506-.853z'
];

function icon(): SVGSVGElement {
	const svg = document.createElementNS(SVG_NS, 'svg');
	const attrs = {
		viewBox: '0 0 24 24',
		width: '18',
		height: '18',
		fill: 'none',
		stroke: 'currentColor',
		'stroke-width': '2',
		'stroke-linecap': 'round',
		'stroke-linejoin': 'round',
		'aria-hidden': 'true'
	};
	for (const [k, v] of Object.entries(attrs)) svg.setAttribute(k, v);
	svg.style.display = 'block';
	svg.style.margin = 'auto';
	for (const d of ICON_PATHS) {
		const path = document.createElementNS(SVG_NS, 'path');
		path.setAttribute('d', d);
		svg.appendChild(path);
	}
	return svg;
}

/** A button on the map that opens the editor panel. */
export class OpenPanelControl implements IControl {
	#container: HTMLDivElement | undefined;

	constructor(private readonly onopen: () => void) {}

	onAdd(): HTMLElement {
		const container = document.createElement('div');
		container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
		const button = document.createElement('button');
		button.type = 'button';
		button.title = 'Show the editor';
		button.setAttribute('aria-label', 'Show the editor');
		button.appendChild(icon());
		button.addEventListener('click', () => this.onopen());
		container.appendChild(button);
		this.#container = container;
		return container;
	}

	/** Moves the button above the other controls of its corner. */
	moveToTop(): void {
		const el = this.#container;
		if (el?.parentElement) el.parentElement.insertBefore(el, el.parentElement.firstChild);
	}

	onRemove(): void {
		this.#container?.remove();
		this.#container = undefined;
	}
}
