<script lang="ts">
	import { styleStore } from '#lib/state/style-store.svelte.js';
</script>

<div
	class="rounded-md border bg-background/90 px-2 py-1 font-mono text-xs tabular-nums shadow-sm backdrop-blur"
	aria-label="Current zoom level"
>
	Zoom {styleStore.zoom.toFixed(2)}
</div>
