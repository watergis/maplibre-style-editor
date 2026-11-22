<script lang="ts">
	import { Switch } from '#lib/components/ui/switch/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { styleStore, type DebugOptions } from '#lib/state/style-store.svelte.js';

	const options: { key: keyof DebugOptions; label: string }[] = [
		{ key: 'showTileBoundaries', label: 'Tile boundaries' },
		{ key: 'showCollisionBoxes', label: 'Collision boxes' },
		{ key: 'showPadding', label: 'Padding' }
	];
</script>

<div
	class="flex flex-col gap-2 rounded-md border bg-background/90 p-2 text-xs shadow-sm backdrop-blur"
>
	{#each options as option (option.key)}
		<div class="flex items-center justify-between gap-3">
			<Label for="debug-{option.key}" class="text-xs font-normal">{option.label}</Label>
			<Switch id="debug-{option.key}" size="sm" bind:checked={styleStore.debug[option.key]} />
		</div>
	{/each}
</div>
