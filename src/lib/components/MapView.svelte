<script lang="ts">
	import { onMount } from 'svelte';
	import {
		GeolocateControl,
		GlobeControl,
		Map as MaplibreMap,
		NavigationControl,
		Popup,
		ScaleControl,
		addProtocol,
		setWorkerUrl,
		type StyleSpecification as MapStyle
	} from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
	import { Protocol } from 'pmtiles';
	import { MaplibreLegendControl } from '@watergis/maplibre-gl-legend';
	import '@watergis/maplibre-gl-legend/dist/maplibre-gl-legend.css';
	import { MaplibreExportControl } from '@watergis/maplibre-gl-export';
	import '@watergis/maplibre-gl-export/dist/maplibre-gl-export.css';
	import MaplibreInspect from '@maplibre/maplibre-gl-inspect';
	import '@maplibre/maplibre-gl-inspect/dist/maplibre-gl-inspect.css';
	import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
	import { styleStore } from '#lib/state/style-store.svelte.js';
	import { OpenPanelControl } from '#lib/map/open-panel-control.js';
	import { ZoomLevelControl } from '#lib/map/zoom-level-control.js';
	import { DebugControl } from '#lib/map/debug-control.js';

	interface Props {
		/** The editor panel is open: the button that opens it is hidden. */
		panelOpen: boolean;
		onopenpanel: () => void;
	}

	let { panelOpen, onopenpanel }: Props = $props();

	// MapLibre GL JS finds its worker next to its own module, which is not where Vite serves it once
	// bundled: point MapLibre to the worker bundled by Vite.
	setWorkerUrl(workerUrl);
	// Sources with `pmtiles://` URLs.
	addProtocol('pmtiles', new Protocol().tile);

	/** How long to wait for more style changes before reading the style of the map. */
	const SYNC_DELAY = 150;

	let container: HTMLDivElement;
	let map = $state.raw<MaplibreMap>();
	let legend: MaplibreLegendControl | undefined;
	let inspect: MaplibreInspect | undefined;
	/** The map shows the inspect style of maplibre-gl-inspect, not the style of the store. */
	let inspecting = false;
	/** The revision of the store the map shows. */
	let shownRevision = -1;
	let syncTimer: ReturnType<typeof setTimeout> | undefined;

	/**
	 * Adds to the sources of the inspector the source layers used by the style. maplibre-gl-inspect
	 * finds them only for vector sources with a TileJSON `url`, not with inline `tiles`.
	 */
	const addInspectSources = (style: StyleSpecification | null | undefined) => {
		if (!inspect || !style) return;
		const sources = inspect.sources;
		for (const [id, source] of Object.entries(style.sources)) {
			if (source.type === 'geojson') sources[id] ??= [];
		}
		for (const layer of style.layers) {
			if (!('source' in layer) || !('source-layer' in layer) || !layer['source-layer']) continue;
			if (style.sources[layer.source]?.type !== 'vector') continue;
			const layers = (sources[layer.source] ??= []);
			if (!layers.includes(layer['source-layer'])) layers.push(layer['source-layer']);
		}
	};

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

		m.addControl(
			new NavigationControl({
				showZoom: true,
				showCompass: true,
				visualizePitch: true,
				visualizeRoll: true
			}),
			'bottom-right'
		);
		m.addControl(
			new GeolocateControl({
				positionOptions: {
					enableHighAccuracy: true
				},
				trackUserLocation: false
			}),
			'bottom-right'
		);
		m.addControl(new GlobeControl(), 'bottom-right');
		m.addControl(new MaplibreExportControl({}), 'bottom-right');
		// Bottom-left, from the bottom up: scale, zoom level, debug options, inspector.
		m.addControl(new ScaleControl(), 'bottom-left');
		m.addControl(new ZoomLevelControl(), 'bottom-left');
		m.addControl(new DebugControl(), 'bottom-left');
		inspect = new MaplibreInspect({
			showInspectButton: true,
			showMapPopup: false,
			showInspectMapPopupOnHover: true,
			popup: new Popup({ closeButton: false, closeOnClick: false }),
			toggleCallback: (show) => {
				inspecting = show;
				// Called before the inspect style is made.
				if (show) addInspectSources(styleStore.style);
			}
		});
		m.addControl(inspect, 'bottom-left');

		// A new style (not a difference applied to the current one): the legend starts over with it.
		m.on('style.load', () => addLegend(m));

		// Changes made on the map, e.g. by the style editor of the legend, go to the store.
		m.on('styledata', () => {
			clearTimeout(syncTimer);
			syncTimer = setTimeout(() => {
				// The inspect style is only shown, never edited.
				if (!styleStore.style || inspecting) return;
				const style = m.getStyle() as StyleSpecification | undefined;
				if (!style) return;
				styleStore.updateFromMap(style);
				shownRevision = styleStore.revision;
			}, SYNC_DELAY);
		});

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
			inspect = undefined;
			inspecting = false;
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
		if (inspecting) {
			// The inspector keeps the new style to restore it, and colors its layers once loaded.
			const m = map;
			m.setStyle(structuredClone<MapStyle>(style), { diff: false });
			m.once('style.load', () => {
				if (!inspecting) return;
				addInspectSources(style);
				inspect?.render();
			});
			return;
		}
		map.setStyle(structuredClone<MapStyle>(style), { diff: origin === 'editor' });
	});

	// The button that opens the editor panel, shown while the panel is closed, above the zoom buttons.
	$effect(() => {
		if (!map || panelOpen) return;
		const m = map;
		const control = new OpenPanelControl(() => onopenpanel());
		m.addControl(control, 'top-right');
		control.moveToTop();
		return () => m.removeControl(control);
	});
</script>

<div bind:this={container} class="h-full w-full"></div>
