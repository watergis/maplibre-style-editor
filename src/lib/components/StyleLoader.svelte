<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { loadFile, loadUrl } from '#lib/actions/load.js';
	import { STYLE_PRESETS, type StylePreset } from '#lib/presets.js';
	import { styleStore } from '#lib/state/style-store.svelte.js';

	const LIST_ID = 'style-url-samples';

	// The URL of the loaded style, which can be edited.
	let url = $derived(styleStore.url ?? '');
	let fileInput: HTMLInputElement;

	/** The list of sample styles is shown while the URL box has the focus. */
	let open = $state(false);
	/** The sample highlighted with the arrow keys. */
	let active = $state(-1);

	function show() {
		open = true;
		active = -1;
	}

	function choose(preset: StylePreset) {
		open = false;
		url = preset.url;
		void loadUrl(preset.url);
	}

	function onkeydown(e: KeyboardEvent) {
		const n = STYLE_PRESETS.length;
		if (e.key === 'Escape') {
			open = false;
		} else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
			if (!open) return show();
			if (e.key === 'ArrowDown') active = (active + 1) % n;
			else active = active <= 0 ? n - 1 : active - 1;
		} else if (e.key === 'Enter' && open && active >= 0) {
			e.preventDefault();
			choose(STYLE_PRESETS[active]);
		}
	}

	function submit(e: SubmitEvent) {
		e.preventDefault();
		open = false;
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
	<div class="relative min-w-0 flex-1">
		<Input
			type="url"
			bind:value={url}
			placeholder="https://example.com/style.json"
			class="h-8 text-xs"
			aria-label="Style URL"
			role="combobox"
			autocomplete="off"
			aria-autocomplete="list"
			aria-expanded={open}
			aria-controls={LIST_ID}
			aria-activedescendant={open && active >= 0 ? `${LIST_ID}-${active}` : undefined}
			onfocus={show}
			onclick={() => !open && show()}
			onblur={() => (open = false)}
			{onkeydown}
		/>
		{#if open}
			<!-- mousedown is prevented so that the URL box keeps the focus -->
			<ul
				id={LIST_ID}
				role="listbox"
				aria-label="Sample styles"
				class="absolute top-full right-0 left-0 z-50 mt-1 max-h-[60dvh] overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
				onmousedown={(e) => e.preventDefault()}
			>
				{#each STYLE_PRESETS as preset, i (preset.id)}
					{#if preset.group !== STYLE_PRESETS[i - 1]?.group}
						<li role="presentation" class="px-2 pt-2 pb-1 text-[11px] text-muted-foreground">
							{preset.group}
						</li>
					{/if}
					<li
						id="{LIST_ID}-{i}"
						role="option"
						aria-selected={i === active}
						class="flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent aria-selected:bg-accent"
						onmousedown={() => choose(preset)}
					>
						<span class="shrink-0 font-medium sm:w-44">{preset.name}</span>
						<span class="hidden truncate text-muted-foreground sm:inline">{preset.url}</span>
						{#if preset.url === styleStore.url}
							<CheckIcon class="ml-auto size-3.5 shrink-0" />
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
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
