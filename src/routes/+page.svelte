<script lang="ts">
	import { onMount } from 'svelte';
	import type { Pane } from 'paneforge';
	import * as Resizable from '#lib/components/ui/resizable/index.js';
	import Header from '#lib/components/Header.svelte';
	import Toolbar from '#lib/components/Toolbar.svelte';
	import MapView from '#lib/components/MapView.svelte';
	import EditorPanel from '#lib/components/EditorPanel.svelte';
	import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
	import { loadFile, loadUrl, STYLE_PARAM } from '#lib/actions/load.js';
	import { DEFAULT_PRESET } from '#lib/presets.js';

	let editorPane = $state<Pane>();
	let panelOpen = $state(true);
	let dragging = $state(false);

	onMount(() => {
		const url = new URL(location.href).searchParams.get(STYLE_PARAM);
		void loadUrl(url || DEFAULT_PRESET.url);
	});

	const openPanel = () => editorPane?.expand();
	const closePanel = () => editorPane?.collapse();

	const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes('Files') ?? false;

	function ondrop(e: DragEvent) {
		if (!hasFiles(e)) return;
		e.preventDefault();
		dragging = false;
		const file = e.dataTransfer?.files[0];
		if (file) void loadFile(file);
	}
</script>

<div class="flex h-dvh flex-col">
	<Header />
	<Toolbar />
	<main class="min-h-0 flex-1">
		<Resizable.PaneGroup direction="horizontal" autoSaveId="maplibre-style-editor:panes">
			<Resizable.Pane defaultSize={60} minSize={20}>
				<div
					class="relative h-full"
					role="region"
					aria-label="Map"
					ondragover={(e) => {
						if (!hasFiles(e)) return;
						e.preventDefault();
						dragging = true;
					}}
					ondragleave={() => (dragging = false)}
					{ondrop}
				>
					<MapView {panelOpen} onopenpanel={openPanel} />
					{#if dragging}
						<div
							class="pointer-events-none absolute inset-0 z-20 flex items-center justify-center border-4 border-dashed border-primary bg-background/60 text-sm font-medium"
						>
							Drop a style (JSON, YAML, or zip of split YAML files)
						</div>
					{/if}
				</div>
			</Resizable.Pane>
			<Resizable.Handle withHandle />
			<Resizable.Pane
				bind:this={editorPane}
				defaultSize={40}
				minSize={25}
				collapsible
				collapsedSize={0}
				onCollapse={() => (panelOpen = false)}
				onExpand={() => (panelOpen = true)}
			>
				<EditorPanel onclose={closePanel} />
			</Resizable.Pane>
		</Resizable.PaneGroup>
	</main>
</div>
<ConfirmDialog />
