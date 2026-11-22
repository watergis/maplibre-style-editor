import { toast } from 'svelte-sonner';
import { goto } from '$app/navigation';
import {
	loadStyleFromFile,
	loadStyleFromUrl,
	validateStyle,
	type LoadedStyle
} from '#lib/load-style.js';
import { styleStore } from '#lib/state/style-store.svelte.js';
import { confirmDiscard } from '#lib/state/confirm.svelte.js';

/** The query parameter of the URL of the style, e.g. `?style=https://.../style.json`. */
export const STYLE_PARAM = 'style';

const setStyleParam = (url: string | null) => {
	const pageUrl = new URL(location.href);
	if (url) pageUrl.searchParams.set(STYLE_PARAM, url);
	else pageUrl.searchParams.delete(STYLE_PARAM);
	// Only the query of the current page changes: there is no route to resolve.
	// eslint-disable-next-line svelte/no-navigation-without-resolve
	void goto(pageUrl, { replace: true, shallow: true });
};

async function load(read: () => Promise<LoadedStyle>, url: string | null) {
	if (!(await confirmDiscard(styleStore.dirty))) return false;
	styleStore.loading = true;
	try {
		const { style, name } = await read();
		const errors = validateStyle(style);
		if (errors.length > 0) {
			toast.warning(`The style has ${errors.length} error(s)`, {
				description: errors.slice(0, 5).join('\n')
			});
		}
		styleStore.load(style, name, url);
		setStyleParam(url);
		return true;
	} catch (e) {
		toast.error('Could not load the style', {
			description: e instanceof Error ? e.message : String(e)
		});
		return false;
	} finally {
		styleStore.loading = false;
	}
}

export const loadUrl = (url: string) => load(() => loadStyleFromUrl(url), url);

export const loadFile = (file: File) => load(() => loadStyleFromFile(file), null);
