export interface StylePreset {
	id: string;
	name: string;
	url: string;
}

/** Sample styles to start from. */
export const STYLE_PRESETS: StylePreset[] = [
	{
		id: 'carto-voyager',
		name: 'CARTO Voyager',
		url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
	},
	{
		id: 'carto-positron',
		name: 'CARTO Positron',
		url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
	},
	{
		id: 'carto-dark-matter',
		name: 'CARTO Dark Matter',
		url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
	}
];

export const DEFAULT_PRESET = STYLE_PRESETS[0];
