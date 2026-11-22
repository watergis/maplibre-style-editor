import { validateStyleMin, type StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import { parseYaml } from '#lib/style-files/index.js';
import { importStyleZip } from '#lib/style-files/zip.js';

export interface LoadedStyle {
	style: StyleSpecification;
	/** A name for the style, e.g. for the names of downloaded files. */
	name: string;
}

const isYaml = (name: string) => /\.ya?ml$/i.test(name);

const baseName = (name: string) =>
	name
		.replace(/[?#].*$/, '')
		.split('/')
		.filter(Boolean)
		.pop()
		?.replace(/\.(json|ya?ml|zip)$/i, '') || 'style';

/** Checks that a parsed value looks like a style, throwing an error that says what is wrong. */
export function assertStyle(value: unknown): asserts value is StyleSpecification {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error('The style must be an object');
	}
	const style = value as Partial<StyleSpecification>;
	if (style.version !== 8) throw new Error('"version" must be 8');
	if (!style.sources || typeof style.sources !== 'object') throw new Error('"sources" is missing');
	if (!Array.isArray(style.layers)) throw new Error('"layers" must be an array');
}

/** The messages of the errors of the style against the style specification. */
export const validateStyle = (style: StyleSpecification): string[] =>
	validateStyleMin(style).map((e) => e.message);

/** Fetches a style (JSON or single YAML) from a URL. */
export async function loadStyleFromUrl(url: string): Promise<LoadedStyle> {
	let res: Response;
	try {
		res = await fetch(url);
	} catch {
		throw new Error(
			`Could not fetch ${url}. The server may not allow requests from this site (CORS).`
		);
	}
	if (!res.ok) throw new Error(`Could not fetch ${url}: ${res.status} ${res.statusText}`);
	const text = await res.text();
	const pathname = new URL(url, location.href).pathname;
	const style: unknown = isYaml(pathname) ? parseYaml(text) : JSON.parse(text);
	assertStyle(style);
	return { style, name: style.name || baseName(pathname) };
}

/** Reads a style from a file: JSON, single YAML, or a zip of `style.yml` + `layers/*.yml`. */
export async function loadStyleFromFile(file: File): Promise<LoadedStyle> {
	let style: unknown;
	if (/\.zip$/i.test(file.name)) {
		style = importStyleZip(new Uint8Array(await file.arrayBuffer()));
	} else if (isYaml(file.name)) {
		style = parseYaml(await file.text());
	} else {
		style = JSON.parse(await file.text());
	}
	assertStyle(style);
	return { style, name: baseName(file.name) };
}
