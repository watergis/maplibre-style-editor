import type { IControl } from 'maplibre-gl';

/** Where the editor panel opens from. */
export type PanelSide = 'right' | 'bottom';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** The Lucide icons `panel-right-open` and `panel-bottom-open`. */
const ICON_PATHS: Record<PanelSide, string[]> = {
	right: ['M15 3v18', 'm10 15-3-3 3-3'],
	bottom: ['M3 15h18', 'm9 10 3-3 3 3']
};

function icon(side: PanelSide): SVGSVGElement {
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
	const rect = document.createElementNS(SVG_NS, 'rect');
	for (const [k, v] of Object.entries({ width: '18', height: '18', x: '3', y: '3', rx: '2' })) {
		rect.setAttribute(k, v);
	}
	svg.appendChild(rect);
	for (const d of ICON_PATHS[side]) {
		const path = document.createElementNS(SVG_NS, 'path');
		path.setAttribute('d', d);
		svg.appendChild(path);
	}
	return svg;
}

/** A button on the map that opens the editor panel. */
export class OpenPanelControl implements IControl {
	#container: HTMLDivElement | undefined;

	constructor(
		private readonly side: PanelSide,
		private readonly onopen: () => void
	) {}

	onAdd(): HTMLElement {
		const container = document.createElement('div');
		container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
		const button = document.createElement('button');
		button.type = 'button';
		button.title = 'Show the editor';
		button.setAttribute('aria-label', 'Show the editor');
		button.appendChild(icon(this.side));
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
