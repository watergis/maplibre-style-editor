<script lang="ts">
	import { onMount } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import type { Pane } from 'paneforge';
	import * as Drawer from '#lib/components/ui/drawer/index.js';
	import * as Resizable from '#lib/components/ui/resizable/index.js';
	import Header from '#lib/components/Header.svelte';
	import Toolbar from '#lib/components/Toolbar.svelte';
	import MapView from '#lib/components/MapView.svelte';
	import EditorPanel from '#lib/components/EditorPanel.svelte';
	import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
	import { loadFile, loadUrl, STYLE_PARAM } from '#lib/actions/load.js';
	import { DEFAULT_PRESET } from '#lib/presets.js';

	/** On wide screens the editor is a pane next to the map, on narrow ones a drawer over it. */
	const wide = new MediaQuery('(min-width: 768px)');

	let editorPane = $state<Pane>();
	/** The editor pane is open (wide screens). */
	let paneOpen = $state(true);
	/** The editor drawer is open (narrow screens): closed at first, so that the map is seen. */
	let drawerOpen = $state(false);
	let dragging = $state(false);

	const panelOpen = $derived(wide.current ? paneOpen : drawerOpen);

	onMount(() => {
		const url = new URL(location.href).searchParams.get(STYLE_PARAM);
		void loadUrl(url || DEFAULT_PRESET.url);
	});

	function openPanel() {
		if (wide.current) editorPane?.expand();
		else drawerOpen = true;
	}

	function closePanel() {
		if (wide.current) editorPane?.collapse();
		else drawerOpen = false;
	}

	const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes('Files') ?? false;

	function ondrop(e: DragEvent) {
		if (!hasFiles(e)) return;
		e.preventDefault();
		dragging = false;
		const file = e.dataTransfer?.files[0];
		if (file) void loadFile(file);
	}
</script>

{#snippet mapArea()}
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
		<MapView {panelOpen} panelSide={wide.current ? 'right' : 'bottom'} onopenpanel={openPanel} />
		{#if dragging}
			<div
				class="pointer-events-none absolute inset-0 z-20 flex items-center justify-center border-4 border-dashed border-primary bg-background/60 p-4 text-center text-sm font-medium"
			>
				Drop a style (JSON, YAML, or zip of split YAML files)
			</div>
		{/if}
	</div>
{/snippet}

<div class="flex h-dvh flex-col">
	<Header />
	<Toolbar />
	<main class="min-h-0 flex-1">
		{#if wide.current}
			<Resizable.PaneGroup direction="horizontal" autoSaveId="maplibre-style-editor:panes">
				<Resizable.Pane defaultSize={60} minSize={20}>
					{@render mapArea()}
				</Resizable.Pane>
				<Resizable.Handle withHandle />
				<Resizable.Pane
					bind:this={editorPane}
					defaultSize={40}
					minSize={25}
					collapsible
					collapsedSize={0}
					onCollapse={() => (paneOpen = false)}
					onExpand={() => (paneOpen = true)}
				>
					<EditorPanel onclose={closePanel} />
				</Resizable.Pane>
			</Resizable.PaneGroup>
		{:else}
			{@render mapArea()}
			<!-- Dragged by its handle only, so that the code editor scrolls and selects text. The
			     content stays mounted while closed, so that the edits are kept. -->
			<Drawer.Root bind:open={drawerOpen} modal={false} handleOnly shouldScaleBackground={false}>
				<!-- Kept below the screen, out of reach, while closed (after the closing animation). -->
				<Drawer.Content
					forceMount
					inert={!drawerOpen}
					class="h-[80dvh] overflow-hidden data-[state=closed]:[transform:translate3d(0,100%,0)]"
					aria-label="Style editor"
				>
					<EditorPanel side="bottom" onclose={closePanel} />
				</Drawer.Content>
			</Drawer.Root>
		{/if}
	</main>
</div>
<ConfirmDialog />
