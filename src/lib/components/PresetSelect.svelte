<script lang="ts">
	import * as Select from '#lib/components/ui/select/index.js';
	import { STYLE_PRESETS } from '#lib/presets.js';
	import { styleStore } from '#lib/state/style-store.svelte.js';
	import { loadUrl } from '#lib/actions/load.js';

	const current = $derived(STYLE_PRESETS.find((p) => p.url === styleStore.url));
</script>

<Select.Root
	type="single"
	value={current?.id ?? ''}
	onValueChange={(id) => {
		const preset = STYLE_PRESETS.find((p) => p.id === id);
		if (preset && preset !== current) void loadUrl(preset.url);
	}}
>
	<Select.Trigger size="sm" class="w-44 text-xs" aria-label="Sample styles">
		{current?.name ?? 'Sample styles'}
	</Select.Trigger>
	<Select.Content>
		{#each STYLE_PRESETS as preset (preset.id)}
			<Select.Item value={preset.id} label={preset.name} class="text-xs">{preset.name}</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>
