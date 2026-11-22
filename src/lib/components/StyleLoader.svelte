<script lang="ts">
	import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { loadFile, loadUrl } from '#lib/actions/load.js';
	import { styleStore } from '#lib/state/style-store.svelte.js';

	// The URL of the loaded style, which can be edited.
	let url = $derived(styleStore.url ?? '');
	let fileInput: HTMLInputElement;

	function submit(e: SubmitEvent) {
		e.preventDefault();
		const value = url.trim();
		if (value) void loadUrl(value);
	}

	function onFile(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (file) void loadFile(file);
	}
</script>

<form class="flex min-w-0 flex-1 items-center gap-2" onsubmit={submit}>
	<Input
		type="url"
		bind:value={url}
		placeholder="https://example.com/style.json"
		class="h-8 min-w-0 flex-1 text-xs"
		aria-label="Style URL"
	/>
	<Button type="submit" size="sm" variant="secondary" disabled={styleStore.loading}>
		{#if styleStore.loading}<LoaderCircleIcon class="animate-spin" />{/if}
		Load
	</Button>
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					type="button"
					size="icon-sm"
					variant="outline"
					aria-label="Open a file"
					onclick={() => fileInput.click()}
				>
					<FolderOpenIcon />
				</Button>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content>Open a file (JSON, YAML, or zip of split YAML files)</Tooltip.Content>
	</Tooltip.Root>
	<input
		bind:this={fileInput}
		type="file"
		accept=".json,.yml,.yaml,.zip,application/json,application/zip"
		class="hidden"
		onchange={onFile}
	/>
</form>
