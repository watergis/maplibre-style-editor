import { toast } from 'svelte-sonner';
import { toSingleYaml } from '#lib/style-files/index.js';
import { exportStyleZip } from '#lib/style-files/zip.js';
import { styleStore } from '#lib/state/style-store.svelte.js';

const download = (data: BlobPart, fileName: string, type: string) => {
	const url = URL.createObjectURL(new Blob([data], { type }));
	const a = document.createElement('a');
	a.href = url;
	a.download = fileName;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 0);
};

const fileBase = () => styleStore.name.replace(/[^\w.-]+/g, '_') || 'style';

export function downloadJson(minify = false) {
	if (!styleStore.style) return;
	const json = JSON.stringify(styleStore.style, null, minify ? undefined : 2);
	download(json, `${fileBase()}${minify ? '.min' : ''}.json`, 'application/json');
}

export function downloadYaml() {
	if (!styleStore.style) return;
	download(toSingleYaml(styleStore.style), `${fileBase()}.yml`, 'application/yaml');
}

/** Downloads `style.yml` and `layers/<id>.yml` as a zip. */
export function downloadZip() {
	if (!styleStore.style) return;
	download(exportStyleZip(styleStore.style), `${fileBase()}.zip`, 'application/zip');
}

export async function copyJson() {
	if (!styleStore.style) return;
	await navigator.clipboard.writeText(JSON.stringify(styleStore.style, null, 2));
	toast.success('Copied the style JSON');
}
