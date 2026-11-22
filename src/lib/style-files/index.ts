/**
 * A MapLibre style kept as YAML files.
 *
 * `style.yml` holds the root of the style (version, sources, sprite, glyphs, ...) and refers to one
 * file per layer (`layers/<id>.yml`) with the `!!inc/file` tag. Variables (`$name`) defined at the
 * root of `style.yml` are replaced in the whole style when the files are joined.
 *
 * The files live in memory (path relative to the root → text).
 */
import YAML, { type ScalarTag } from 'yaml';
import type { LayerSpecification, StyleSpecification } from '@maplibre/maplibre-gl-style-spec';

/** The files of a split style: path relative to the root → text. */
export type StyleFiles = Record<string, string>;

export const STYLE_FILE = 'style.yml';
export const LAYERS_DIR = 'layers';

const INC_FILE_TAG = 'tag:yaml.org,2002:inc/file';

const STRINGIFY_OPTIONS = { singleQuote: true, indent: 2, lineWidth: 40 } as const;

/** The path of the file of a layer, e.g. `layers/water.yml`. */
export const layerFilePath = (layerId: string) => `${LAYERS_DIR}/${layerId}.yml`;

class IncFile {
	constructor(public readonly value: string) {}
	toString() {
		return this.value;
	}
}

const incFileWriteTag: ScalarTag = {
	tag: INC_FILE_TAG,
	identify: (value) => value instanceof IncFile,
	resolve: (str) => str,
	stringify: (item) => String((item as { value: unknown }).value)
};

/** Stringifies a value as YAML. */
export const toYaml = (value: unknown): string =>
	YAML.stringify(value, null, { ...STRINGIFY_OPTIONS, customTags: [incFileWriteTag] });

/** Splits a style into `style.yml` and one `layers/<id>.yml` per layer. */
export function splitStyle(style: StyleSpecification): StyleFiles {
	const files: StyleFiles = {};
	for (const layer of style.layers) files[layerFilePath(layer.id)] = toYaml(layer);
	files[STYLE_FILE] = toRootYaml(style);
	return files;
}

/** The `style.yml` alone, referring to the files of the layers. */
export const toRootYaml = (style: StyleSpecification): string =>
	toYaml({ ...style, layers: style.layers.map((l) => new IncFile(layerFilePath(l.id))) });

/** The whole style as a single YAML file. */
export const toSingleYaml = (style: StyleSpecification): string => toYaml(style);

const normalizePath = (path: string) =>
	path
		.split('/')
		.reduce<string[]>((parts, part) => {
			if (part === '..') parts.pop();
			else if (part !== '.' && part !== '') parts.push(part);
			return parts;
		}, [])
		.join('/');

/** Parses YAML: `!!inc/file` is resolved from `files` (relative to the root) and `$variables` are replaced. */
export function parseYaml(text: string, files: StyleFiles = {}): unknown {
	const visiting = new Set<string>();
	const incFileReadTag: ScalarTag = {
		tag: INC_FILE_TAG,
		identify: () => false,
		resolve(str, onError) {
			const path = normalizePath(str);
			const src = files[path];
			if (src === undefined) {
				onError(`!!inc/file: ${path} is not found`);
				return null;
			}
			if (visiting.has(path)) {
				onError(`!!inc/file: ${path} includes itself`);
				return null;
			}
			visiting.add(path);
			try {
				return parse(src);
			} finally {
				visiting.delete(path);
			}
		}
	};
	const parse = (src: string): unknown => YAML.parse(src, { customTags: [incFileReadTag] });
	return resolveVariables(parse(text));
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Replaces the `$variables` defined at the root: a string value that is exactly `"$name"` is
 * replaced by the value of the variable, which can itself refer to other variables.
 */
export function resolveVariables(obj: unknown): unknown {
	if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return obj;
	const variables: Record<string, unknown> = {};
	const styleObj: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(obj)) {
		if (key.startsWith('$')) variables[key] = value;
		else styleObj[key] = value;
	}
	const names = Object.keys(variables);
	if (names.length === 0) return styleObj;

	const patterns = names.map((name) => [name, new RegExp(`"${escapeRegExp(name)}"`, 'g')] as const);
	const refersToVariable = (json: string) => patterns.some(([, re]) => json.search(re) !== -1);
	const replace = (json: string) =>
		patterns.reduce((acc, [name, re]) => acc.replace(re, JSON.stringify(variables[name])), json);

	// Nested variables: each pass resolves one more level, so names.length passes resolve them all.
	for (let i = 0; i < names.length; i++) {
		for (const name of names)
			variables[name] = JSON.parse(replace(JSON.stringify(variables[name])));
	}
	if (refersToVariable(JSON.stringify(Object.values(variables)))) {
		throw new Error('Variables refer to each other in a loop');
	}
	return JSON.parse(replace(JSON.stringify(styleObj)));
}

/** Joins the files of a split style into a style. */
export function joinStyle(files: StyleFiles, entry = STYLE_FILE): StyleSpecification {
	const root = files[entry];
	if (root === undefined) throw new Error(`${entry} is not found`);
	const style = parseYaml(root, files) as StyleSpecification;
	if (!style || typeof style !== 'object' || !Array.isArray(style.layers)) {
		throw new Error(`${entry} is not a style: "layers" must be an array`);
	}
	return style;
}

/** Parses a layer written as JSON or YAML. */
export function parseLayer(text: string, format: 'json' | 'yaml'): LayerSpecification {
	const layer = (format === 'json' ? JSON.parse(text) : parseYaml(text)) as LayerSpecification;
	if (!layer || typeof layer !== 'object' || Array.isArray(layer)) {
		throw new Error('A layer must be an object');
	}
	if (typeof layer.id !== 'string' || !layer.id) throw new Error('A layer needs an "id"');
	if (typeof layer.type !== 'string') throw new Error('A layer needs a "type"');
	return layer;
}
