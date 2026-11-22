import { describe, expect, it } from 'vitest';
import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import {
	applyTarget,
	DocumentError,
	renderTarget,
	targetFileName,
	type Target
} from './documents.js';

const style: StyleSpecification = {
	version: 8,
	sources: { s: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } },
	layers: [
		{ id: 'bg', type: 'background', paint: { 'background-color': '#fff' } },
		{ id: 'fill', type: 'fill', source: 's', paint: { 'fill-color': '#f00' } }
	]
};

const whole: Target = { kind: 'style' };
const root: Target = { kind: 'root' };
const fill: Target = { kind: 'layer', id: 'fill' };

const errorOf = (fn: () => unknown) => {
	try {
		fn();
	} catch (e) {
		return e as DocumentError;
	}
	throw new Error('no error');
};

describe('render and apply round-trip', () => {
	for (const target of [whole, root, fill]) {
		for (const format of ['json', 'yaml'] as const) {
			it(`${target.kind} as ${format}`, () => {
				const text = renderTarget(style, target, format);
				expect(text).not.toBeNull();
				expect(applyTarget(style, target, format, text!)).toEqual(style);
			});
		}
	}
});

describe('renderTarget', () => {
	it('shows the root as JSON without the layers', () => {
		expect(JSON.parse(renderTarget(style, root, 'json')!)).not.toHaveProperty('layers');
	});

	it('shows the root as YAML with the includes of the layers', () => {
		expect(renderTarget(style, root, 'yaml')).toContain('- !!inc/file layers/fill.yml');
	});

	it('returns null for a missing layer', () => {
		expect(renderTarget(style, { kind: 'layer', id: 'nope' }, 'json')).toBeNull();
	});
});

describe('applyTarget', () => {
	it('replaces a layer, also renaming it', () => {
		const text = JSON.stringify({ id: 'fill2', type: 'fill', source: 's' });
		const edited = applyTarget(style, fill, 'json', text);
		expect(edited.layers.map((l) => l.id)).toEqual(['bg', 'fill2']);
	});

	it('refuses a duplicate layer id', () => {
		const text = JSON.stringify({ id: 'bg', type: 'fill', source: 's' });
		expect(() => applyTarget(style, fill, 'json', text)).toThrow(/already exists/);
	});

	it('reorders and removes layers from the includes of style.yml', () => {
		const text = renderTarget(style, root, 'yaml')!.replace(
			/ {2}- !!inc\/file layers\/bg.yml\n/,
			''
		);
		expect(applyTarget(style, root, 'yaml', text).layers.map((l) => l.id)).toEqual(['fill']);
	});

	it('refuses layers in the root as JSON', () => {
		const text = JSON.stringify(style);
		expect(() => applyTarget(style, root, 'json', text)).toThrow(/layers/);
	});

	it('gives the position of a JSON syntax error', () => {
		const text = '{\n  "id": "fill",\n  "type": fill\n}';
		const e = errorOf(() => applyTarget(style, fill, 'json', text));
		expect(e).toBeInstanceOf(DocumentError);
		expect(e.from).toBe(text.indexOf('fill\n'));
	});

	it('gives the position of a YAML syntax error', () => {
		const text = 'id: fill\ntype: fill\npaint: {fill-color: [}\n';
		const e = errorOf(() => applyTarget(style, fill, 'yaml', text));
		expect(e).toBeInstanceOf(DocumentError);
		expect(e.from).toBeGreaterThan(text.indexOf('paint'));
	});

	it('checks the whole style', () => {
		expect(() => applyTarget(style, whole, 'json', '{"version": 7}')).toThrow(/version/);
	});
});

describe('targetFileName', () => {
	it('names the files', () => {
		expect(targetFileName(whole, 'json')).toBe('style.json');
		expect(targetFileName(root, 'yaml')).toBe('style.yml');
		expect(targetFileName(fill, 'yaml')).toBe('layers/fill.yml');
		expect(targetFileName(fill, 'json')).toBe('layers/fill.json');
	});
});
