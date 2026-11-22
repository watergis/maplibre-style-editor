<script lang="ts">
	import { onMount } from 'svelte';
	import MapView from '#lib/components/MapView.svelte';
	import { loadUrl, STYLE_PARAM } from '#lib/actions/load.js';
	import { DEFAULT_PRESET } from '#lib/presets.js';

	onMount(() => {
		const url = new URL(location.href).searchParams.get(STYLE_PARAM);
		void loadUrl(url || DEFAULT_PRESET.url);
	});
</script>

<div class="flex h-dvh flex-col">
	<main class="min-h-0 flex-1">
		<MapView />
	</main>
</div>
