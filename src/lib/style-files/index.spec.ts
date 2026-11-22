import { describe, expect, it } from 'vitest';
import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import {
	joinStyle,
	splitStyle,
	parseLayer,
	parseYaml,
	resolveVariables,
	toSingleYaml,
	toRootYaml
} from './index.js';
import { exportStyleZip, importStyleZip, readStyleZip } from './zip.js';

const style: StyleSpecification = {
	version: 8,
	name: 'Test',
	glyphs: 'https://example.com/fonts/{fontstack}/{range}.pbf',
	sources: {
		carto: { type: 'vector', url: 'https://example.com/tiles.json' }
	},
	layers: [
		{ id: 'background', type: 'background', paint: { 'background-color': '#fafaf8' } },
		{
			id: 'water',
			type: 'fill',
			source: 'carto',
			'source-layer': 'water',
			filter: ['==', ['geometry-type'], 'Polygon'],
			paint: {
				'fill-color': ['interpolate', ['linear'], ['zoom'], 0, '#d4dadc', 10, 'rgba(212,218,220,1)']
			}
		},
		{
			id: 'place_label',
			type: 'symbol',
			source: 'carto',
			'source-layer': 'place',
			layout: { 'text-field': '{name}', 'text-font': ['Montserrat Medium'] },
			paint: { 'text-color': "it's #333" }
		}
	]
};

describe('splitStyle / joinStyle', () => {
	it('splits the style into style.yml and layers/<id>.yml', () => {
		const files = splitStyle(style);
		expect(Object.keys(files).sort()).toEqual([
			'layers/background.yml',
			'layers/place_label.yml',
			'layers/water.yml',
			'style.yml'
		]);
		expect(files['style.yml']).toContain('- !!inc/file layers/water.yml');
		expect(files['layers/water.yml']).toContain('id: water');
	});

	it('round-trips', () => {
		expect(joinStyle(splitStyle(style))).toEqual(style);
	});

	it('does not change the given style', () => {
		const copy = structuredClone(style);
		splitStyle(copy);
		expect(copy).toEqual(style);
	});

	it('follows the order of the includes in style.yml', () => {
		const files = splitStyle(style);
		files['style.yml'] = toRootYaml({ ...style, layers: [...style.layers].reverse() });
		const layers = joinStyle(files).layers.map((l) => l.id);
		expect(layers).toEqual(['place_label', 'water', 'background']);
	});

	it('reports a missing include', () => {
		const files = splitStyle(style);
		delete files['layers/water.yml'];
		expect(() => joinStyle(files)).toThrow(/layers\/water.yml is not found/);
	});

	it('toRootYaml is the style.yml of splitStyle', () => {
		expect(toRootYaml(style)).toBe(splitStyle(style)['style.yml']);
	});
});

describe('single YAML', () => {
	it('round-trips', () => {
		expect(parseYaml(toSingleYaml(style))).toEqual(style);
	});
});

describe('variables', () => {
	it('replaces variables, also nested ones', () => {
		const yaml = [
			'$base: "#ff0000"',
			'$water: $base',
			'version: 8',
			'sources: {}',
			'layers:',
			'  - id: a',
			'    type: background',
			'    paint:',
			'      background-color: $water'
		].join('\n');
		const parsed = parseYaml(yaml) as StyleSpecification;
		expect(parsed).not.toHaveProperty('$base');
		expect(parsed.layers[0]).toEqual({
			id: 'a',
			type: 'background',
			paint: { 'background-color': '#ff0000' }
		});
	});

	it('replaces variables in included files', () => {
		const files = {
			'style.yml': '$c: "#00f"\nversion: 8\nsources: {}\nlayers:\n  - !!inc/file layers/a.yml\n',
			'layers/a.yml': 'id: a\ntype: background\npaint:\n  background-color: $c\n'
		};
		expect(joinStyle(files).layers[0]).toMatchObject({ paint: { 'background-color': '#00f' } });
	});

	it('throws on a loop of variables', () => {
		expect(() => resolveVariables({ $a: '$b', $b: '$a', version: 8 })).toThrow(/loop/);
	});
});

describe('parseLayer', () => {
	it('parses JSON and YAML', () => {
		const layer = style.layers[1];
		expect(parseLayer(JSON.stringify(layer), 'json')).toEqual(layer);
		expect(parseLayer(splitStyle(style)['layers/water.yml'], 'yaml')).toEqual(layer);
	});

	it('requires id and type', () => {
		expect(() => parseLayer('{"type":"fill"}', 'json')).toThrow(/id/);
		expect(() => parseLayer('id: a', 'yaml')).toThrow(/type/);
	});
});

describe('zip', () => {
	it('round-trips a split style', () => {
		expect(importStyleZip(exportStyleZip(style))).toEqual(style);
	});

	it('finds the project in a folder of the zip', async () => {
		const { zipSync, strToU8 } = await import('fflate');
		const files = splitStyle(style);
		const zip = zipSync(
			Object.fromEntries(Object.entries(files).map(([p, t]) => [`project/${p}`, strToU8(t)]))
		);
		expect(Object.keys(readStyleZip(zip)).sort()).toEqual(Object.keys(files).sort());
	});
});
