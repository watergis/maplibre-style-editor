/**
 * The documents the editor panel shows: the whole style, or one of its split files (`style.yml`,
 * `layers/<id>.yml`), as JSON or YAML; and how an edited document changes the style.
 */
import { YAMLError } from 'yaml';
import { parse as parseJsonc, printParseErrorCode, type ParseError } from 'jsonc-parser';
import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import {
	joinStyle,
	layerFilePath,
	parseLayer,
	parseYaml,
	splitStyle,
	STYLE_FILE,
	toRootYaml,
	toSingleYaml,
	toYaml
} from '#lib/style-files/index.js';
import { assertStyle } from '#lib/load-style.js';

export type Format = 'json' | 'yaml';

/** What the editor shows: the whole style, the root of the split files, or the file of a layer. */
export type Target = { kind: 'style' } | { kind: 'root' } | { kind: 'layer'; id: string };

export const targetKey = (t: Target) => (t.kind === 'layer' ? `layer:${t.id}` : t.kind);

/** The name of the file of a target, e.g. `layers/water.yml` or `style.json`. */
export function targetFileName(target: Target, format: Format): string {
	const ext = format === 'json' ? 'json' : 'yml';
	if (target.kind === 'layer') return layerFilePath(target.id).replace(/\.yml$/, `.${ext}`);
	return target.kind === 'root' ? STYLE_FILE.replace(/\.yml$/, `.${ext}`) : `style.${ext}`;
}

const toJson = (value: unknown) => JSON.stringify(value, null, 2) + '\n';

/** The text of a target. Returns null when the target does not exist in the style (e.g. a removed layer). */
export function renderTarget(
	style: StyleSpecification,
	target: Target,
	format: Format
): string | null {
	switch (target.kind) {
		case 'style':
			return format === 'json' ? toJson(style) : toSingleYaml(style);
		case 'root': {
			if (format === 'yaml') return toRootYaml(style);
			// JSON cannot refer to other files: the root is shown without the layers.
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { layers, ...root } = style;
			return toJson(root);
		}
		case 'layer': {
			const layer = style.layers.find((l) => l.id === target.id);
			if (!layer) return null;
			return format === 'json' ? toJson(layer) : toYaml(layer);
		}
	}
}

/** An error in the edited text, with its position when it is known. */
export class DocumentError extends Error {
	constructor(
		message: string,
		public readonly from?: number,
		public readonly to?: number
	) {
		super(message);
	}
}

/** Rethrows a JSON or YAML parse error as a DocumentError with its position. */
function toDocumentError(e: unknown, text: string): DocumentError {
	if (e instanceof DocumentError) return e;
	if (e instanceof YAMLError) {
		return new DocumentError(e.message.split('\n')[0], e.pos[0], e.pos[1]);
	}
	if (e instanceof SyntaxError) {
		// The messages of JSON.parse do not always say where the error is: find it again.
		const errors: ParseError[] = [];
		parseJsonc(text, errors, { allowTrailingComma: false, disallowComments: true });
		const first = errors[0];
		if (first) {
			return new DocumentError(
				`${printParseErrorCode(first.error)}: ${e.message}`,
				first.offset,
				first.offset + Math.max(first.length, 1)
			);
		}
		return new DocumentError(e.message);
	}
	return new DocumentError(e instanceof Error ? e.message : String(e));
}

const parseText = (text: string, format: Format): unknown =>
	format === 'json' ? JSON.parse(text) : parseYaml(text);

/**
 * The style after an edit of a target.
 *
 * - whole style: the edited style
 * - root as YAML: `style.yml` joined with the files of the current layers, so the list of
 *   `!!inc/file` can reorder or remove layers
 * - root as JSON: the edited root with the current layers
 * - layer: the style with the layer replaced (its id may change)
 */
export function applyTarget(
	style: StyleSpecification,
	target: Target,
	format: Format,
	text: string
): StyleSpecification {
	try {
		switch (target.kind) {
			case 'style': {
				const edited = parseText(text, format);
				assertStyle(edited);
				return edited;
			}
			case 'root': {
				if (format === 'yaml') {
					const edited = joinStyle({ ...splitStyle(style), [STYLE_FILE]: text });
					assertStyle(edited);
					return edited;
				}
				const root = parseText(text, format) as Record<string, unknown>;
				if (!root || typeof root !== 'object' || Array.isArray(root)) {
					throw new DocumentError('The root of the style must be an object');
				}
				if ('layers' in root) {
					throw new DocumentError(
						'"layers" cannot be edited here: edit each layer, or the whole style'
					);
				}
				const edited = { ...root, layers: style.layers };
				assertStyle(edited);
				return edited;
			}
			case 'layer': {
				const layer = parseLayer(text, format);
				if (layer.id !== target.id && style.layers.some((l) => l.id === layer.id)) {
					throw new DocumentError(`A layer "${layer.id}" already exists`);
				}
				if (!style.layers.some((l) => l.id === target.id)) {
					throw new DocumentError(`The layer "${target.id}" is not in the style anymore`);
				}
				return {
					...style,
					layers: style.layers.map((l) => (l.id === target.id ? layer : l))
				};
			}
		}
	} catch (e) {
		throw toDocumentError(e, text);
	}
}
