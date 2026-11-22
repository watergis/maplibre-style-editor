import { strFromU8, strToU8, unzipSync, zipSync, type Zippable } from 'fflate';
import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import { joinStyle, splitStyle, STYLE_FILE, type StyleFiles } from './index';

/** Zips a style split into `style.yml` and `layers/<id>.yml`. */
export function exportStyleZip(style: StyleSpecification): Uint8Array<ArrayBuffer> {
	const zippable: Zippable = {};
	for (const [path, text] of Object.entries(splitStyle(style))) zippable[path] = strToU8(text);
	return zipSync(zippable);
}

/**
 * Reads the YAML files of a split style from a zip. They may be in a folder of the zip: the folder
 * of the shallowest `style.yml` is used as the root.
 */
export function readStyleZip(data: Uint8Array): StyleFiles {
	const entries = unzipSync(data, {
		filter: (file) => /\.ya?ml$/i.test(file.name) && !file.name.startsWith('__MACOSX/')
	});
	const styleEntry = Object.keys(entries)
		.filter((name) => name === STYLE_FILE || name.endsWith(`/${STYLE_FILE}`))
		.sort((a, b) => a.split('/').length - b.split('/').length)[0];
	if (!styleEntry) throw new Error(`${STYLE_FILE} is not found in the zip`);
	const prefix = styleEntry.slice(0, -STYLE_FILE.length);

	const files: StyleFiles = {};
	for (const [name, bytes] of Object.entries(entries)) {
		if (name.startsWith(prefix)) files[name.slice(prefix.length)] = strFromU8(bytes);
	}
	return files;
}

/** Joins the style from a zip of split YAML files. */
export const importStyleZip = (data: Uint8Array): StyleSpecification =>
	joinStyle(readStyleZip(data));
