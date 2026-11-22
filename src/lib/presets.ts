export interface StylePreset {
	id: string;
	/** The provider of the style, which groups the samples. */
	group: string;
	name: string;
	url: string;
}

/**
 * Sample styles to start from. The MapLibre demo styles are listed in
 * https://github.com/maplibre/demotiles
 */
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
		group: 'MapLibre demo',
		name: 'MapLibre World',
		url: 'https://demotiles.maplibre.org/style.json'
	},
	{
		id: 'maplibre-osm-bright',
		group: 'MapLibre demo',
		name: 'OpenMapTiles (Innsbruck)',
		url: 'https://demotiles.maplibre.org/styles/osm-bright-gl-style/style.json'
	},
	{
		id: 'maplibre-terrain',
		group: 'MapLibre demo',
		name: 'Terrain (Innsbruck)',
		url: 'https://demotiles.maplibre.org/styles/osm-bright-gl-terrain/style.json'
	},
	{
		id: 'maplibre-debug',
		group: 'MapLibre demo',
		name: 'Debug',
		url: 'https://demotiles.maplibre.org/debug-tiles/style.json'
	},
	{
		id: 'maplibre-pmtiles-vector',
		group: 'MapLibre demo',
		name: 'PMTiles Vector World',
		url: 'https://demotiles.maplibre.org/pmtiles/vector/style.json'
	},
	{
		id: 'maplibre-pmtiles-imagery',
		group: 'MapLibre demo',
		name: 'PMTiles Raster (imagery)',
		url: 'https://demotiles.maplibre.org/pmtiles/raster/style-imagery.json'
	},
	{
		id: 'maplibre-pmtiles-watercolor',
		group: 'MapLibre demo',
		name: 'PMTiles Raster (watercolor)',
		url: 'https://demotiles.maplibre.org/pmtiles/raster/style-watercolor.json'
	}
];

export const DEFAULT_PRESET = STYLE_PRESETS[0];
