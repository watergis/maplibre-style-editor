export interface StylePreset {
	id: string;
	/** The provider of the style, which groups the samples. */
	group: string;
	name: string;
	url: string;
}

/** Sample styles to start from. */
export const STYLE_PRESETS: StylePreset[] = [
	{
		id: 'carto-voyager',
		group: 'CARTO',
		name: 'Voyager',
		url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
	},
	{
		id: 'carto-positron',
		group: 'CARTO',
		name: 'Positron',
		url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
	},
	{
		id: 'carto-dark-matter',
		group: 'CARTO',
		name: 'Dark Matter',
		url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
	},
	{
		id: 'maplibre-world',
		group: 'MapLibre',
		name: 'MapLibre World',
		url: 'https://demotiles.maplibre.org/style.json'
	}
];

export const DEFAULT_PRESET = STYLE_PRESETS[0];
