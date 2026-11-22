<script lang="ts">
	import type { Map as MaplibreMap } from 'maplibre-gl';

	let { map }: { map: MaplibreMap } = $props();

	let zoom = $state(0);

	$effect(() => {
		const update = () => (zoom = map.getZoom());
		update();
		map.on('zoom', update);
		return () => map.off('zoom', update);
	});
</script>

<div
	class="rounded-md border bg-background/90 px-2 py-1 font-mono text-xs text-foreground tabular-nums shadow-sm backdrop-blur"
	aria-label="Current zoom level"
>
	Zoom {zoom.toFixed(2)}
</div>
