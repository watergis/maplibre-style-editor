<script lang="ts">
	import type { Map as MaplibreMap } from 'maplibre-gl';
	import { Switch } from '#lib/components/ui/switch/index.js';
	import { Label } from '#lib/components/ui/label/index.js';

	let { map }: { map: MaplibreMap } = $props();

	type Option = 'showTileBoundaries' | 'showCollisionBoxes';

	const options: { key: Option; label: string }[] = [
		{ key: 'showTileBoundaries', label: 'Tile boundaries' },
		{ key: 'showCollisionBoxes', label: 'Collision boxes' }
	];

	let checked = $state<Record<Option, boolean>>({
		showTileBoundaries: false,
		showCollisionBoxes: false
	});

	$effect(() => {
		for (const { key } of options) map[key] = checked[key];
	});
</script>

<div
	class="flex flex-col gap-2 rounded-md border bg-background/90 p-2 text-xs text-foreground shadow-sm backdrop-blur"
>
	{#each options as option (option.key)}
		<div class="flex items-center justify-between gap-3">
			<Label for="debug-{option.key}" class="text-xs font-normal">{option.label}</Label>
			<Switch id="debug-{option.key}" size="sm" bind:checked={checked[option.key]} />
		</div>
	{/each}
</div>
