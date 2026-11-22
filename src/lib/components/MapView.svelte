<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Map as MaplibreMap,
		NavigationControl,
		ScaleControl,
		type StyleSpecification as MapStyle
	} from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import '#lib/maplibre-worker.js';
	import '#lib/maplibre-protocols.js';
	import { MaplibreLegendControl } from '@watergis/maplibre-gl-legend';
	import '@watergis/maplibre-gl-legend/dist/maplibre-gl-legend.css';
	import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
	import { styleStore } from '#lib/state/style-store.svelte.js';
	import MapDebugControls from './MapDebugControls.svelte';
	import ZoomIndicator from './ZoomIndicator.svelte';

	/** How long to wait for more style changes before reading the style of the map. */
	const SYNC_DELAY = 150;

	let container: HTMLDivElement;
	let map = $state.raw<MaplibreMap>();
	let legend: MaplibreLegendControl | undefined;
	/** The revision of the store the map shows. */
	let shownRevision = -1;
	let syncTimer: ReturnType<typeof setTimeout> | undefined;

	const addLegend = (m: MaplibreMap) => {
		if (legend) m.removeControl(legend);
		legend = new MaplibreLegendControl({}, { groupBySourceLayer: true, showStyleEditor: true });
		m.addControl(legend, 'top-left');
	};

	onMount(() => {
		const m = new MaplibreMap({
			container,
			style: { version: 8, sources: {}, layers: [] },
			hash: true,
			attributionControl: { compact: true }
		});
		m.addControl(new NavigationControl(), 'top-right');
		m.addControl(new ScaleControl(), 'bottom-left');

		// A new style (not a difference applied to the current one): the legend starts over with it.
		m.on('style.load', () => addLegend(m));

		// Changes made on the map, e.g. by the style editor of the legend, go to the store.
		m.on('styledata', () => {
			clearTimeout(syncTimer);
			syncTimer = setTimeout(() => {
				if (!styleStore.style) return;
				const style = m.getStyle() as StyleSpecification | undefined;
				if (!style) return;
				styleStore.updateFromMap(style);
				shownRevision = styleStore.revision;
			}, SYNC_DELAY);
		});

		const updateZoom = () => (styleStore.zoom = m.getZoom());
		m.on('zoom', updateZoom);
		updateZoom();

		// The map follows the size of its pane, not only of the window.
		const observer = new ResizeObserver(() => m.resize());
		observer.observe(container);

		map = m;
		// For debugging in the browser console.
		if (import.meta.env.DEV) Object.assign(window, { map: m });
		return () => {
			clearTimeout(syncTimer);
			observer.disconnect();
			m.remove();
			map = undefined;
		};
	});

	// Changes of the store (a loaded or edited style) go to the map.
	$effect(() => {
		const { style, revision, origin } = styleStore;
		if (!map || !style || revision === shownRevision) return;
		shownRevision = revision;
		if (origin === 'map') return;
		// A pending read of the map would overwrite the store with the style being replaced.
		clearTimeout(syncTimer);
		// The map keeps the object it is given: pass a copy so that the store is never mutated.
		map.setStyle(structuredClone<MapStyle>(style), { diff: origin === 'editor' });
	});

	$effect(() => {
		if (!map) return;
		map.showTileBoundaries = styleStore.debug.showTileBoundaries;
		map.showCollisionBoxes = styleStore.debug.showCollisionBoxes;
		map.showPadding = styleStore.debug.showPadding;
	});
</script>

<div class="relative h-full w-full">
	<div bind:this={container} class="h-full w-full"></div>
	<div class="pointer-events-none absolute bottom-10 left-2.5 z-10 flex flex-col items-start gap-2">
		<div class="pointer-events-auto"><MapDebugControls /></div>
		<div class="pointer-events-auto"><ZoomIndicator /></div>
	</div>
</div>
