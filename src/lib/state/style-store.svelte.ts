import type { LayerSpecification, StyleSpecification } from '@maplibre/maplibre-gl-style-spec';

/**
 * Where a change of the style came from:
 * - `load`: a new style was loaded (the map replaces its style)
 * - `editor`: the style was edited as JSON / YAML (the map applies the difference)
 * - `map`: the map changed, e.g. by the style editor of the legend (the map is already up to date)
 */
export type ChangeOrigin = 'load' | 'editor' | 'map';

export interface DebugOptions {
	showTileBoundaries: boolean;
	showCollisionBoxes: boolean;
	showPadding: boolean;
}

/** The style being edited, shared by the map and the editor panel. */
class StyleStore {
	/** The current style. It is replaced, never mutated. */
	style = $state.raw<StyleSpecification | null>(null);
	/** A name for the style, used for the names of downloaded files. */
	name = $state('style');
	/** The URL the style was loaded from, if any. */
	url = $state<string | null>(null);
	origin = $state<ChangeOrigin>('load');
	/** Incremented on every change of `style`. */
	revision = $state(0);
	loading = $state(false);
	/** Whether the editor panel has edits not applied yet. */
	dirty = $state(false);

	debug = $state<DebugOptions>({
		showTileBoundaries: false,
		showCollisionBoxes: false,
		showPadding: false
	});
	zoom = $state(0);

	layerIds = $derived(this.style?.layers.map((l) => l.id) ?? []);

	private set(style: StyleSpecification, origin: ChangeOrigin) {
		this.style = style;
		this.origin = origin;
		this.revision++;
	}

	load(style: StyleSpecification, name: string, url: string | null = null) {
		this.name = name;
		this.url = url;
		this.dirty = false;
		this.set(style, 'load');
	}

	/** The map changed its style. */
	updateFromMap(style: StyleSpecification) {
		this.set(style, 'map');
	}

	/** Replaces the whole style with an edited one. */
	apply(style: StyleSpecification) {
		this.set(style, 'editor');
	}

	/** Replaces the layer `id` with an edited one, whose id may be different. */
	applyLayer(id: string, layer: LayerSpecification) {
		if (!this.style) return;
		if (layer.id !== id && this.layerIds.includes(layer.id)) {
			throw new Error(`A layer "${layer.id}" already exists`);
		}
		const layers = this.style.layers.map((l) => (l.id === id ? layer : l));
		this.apply({ ...this.style, layers });
	}

	/** Replaces everything but the layers. */
	applyRoot(root: Omit<StyleSpecification, 'layers'>) {
		if (!this.style) return;
		this.apply({ ...root, layers: this.style.layers });
	}
}

export const styleStore = new StyleStore();
