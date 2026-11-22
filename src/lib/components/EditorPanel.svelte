<script lang="ts">
	import { untrack } from 'svelte';
	import { toast } from 'svelte-sonner';
	import BracesIcon from '@lucide/svelte/icons/braces';
	import FilesIcon from '@lucide/svelte/icons/files';
	import PlayIcon from '@lucide/svelte/icons/play';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import PanelBottomCloseIcon from '@lucide/svelte/icons/panel-bottom-close';
	import PanelRightCloseIcon from '@lucide/svelte/icons/panel-right-close';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { Switch } from '#lib/components/ui/switch/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import CodeEditor, { type EditorDiagnostic } from './CodeEditor.svelte';
	import LayerFileList from './LayerFileList.svelte';
	import {
		applyTarget,
		DocumentError,
		renderTarget,
		targetFileName,
		targetKey,
		type Format,
		type Target
	} from '#lib/editor/documents.js';
	import { validateStyle } from '#lib/load-style.js';
	import { styleStore } from '#lib/state/style-store.svelte.js';
	import { confirmDiscard } from '#lib/state/confirm.svelte.js';
	import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
	import type { PanelSide } from '#lib/map/open-panel-control.js';

	interface Props {
		/** Where the panel is, for the icon of the button that closes it. */
		side?: PanelSide;
		onclose: () => void;
	}

	let { side = 'right', onclose }: Props = $props();

	type Scope = 'style' | 'files';

	/** How long to wait after typing before checking the text. */
	const CHECK_DELAY = 300;
	/** How long to wait after typing before applying the text, when "Auto apply" is on. */
	const AUTO_APPLY_DELAY = 600;

	let scope = $state<Scope>('files');
	let format = $state<Format>('yaml');
	let selected = $state<Target>({ kind: 'root' });
	let autoApply = $state(false);

	const target = $derived<Target>(scope === 'style' ? { kind: 'style' } : selected);
	const style = $derived(styleStore.style);
	const source = $derived(style ? renderTarget(style, target, format) : null);

	/** The text in the editor. */
	let text = $state('');
	/** The text of the style the edits started from. */
	let base = $state('');
	/** The style changed (e.g. on the map) while there were edits. */
	let outdated = $state(false);
	let diagnostics = $state<EditorDiagnostic[]>([]);
	/** Errors against the style specification that the edits would add. */
	let problems = $state<string[]>([]);

	const dirty = $derived(text !== base);
	$effect(() => {
		styleStore.dirty = dirty;
	});

	// The errors the current style already has: edits are only blamed for new ones.
	const currentErrors = $derived(new Set(style ? validateStyle(style) : []));

	// The selected layer is not in the style anymore (removed or renamed elsewhere).
	$effect(() => {
		if (scope === 'files' && selected.kind === 'layer' && style && source === null) {
			selected = { kind: 'root' };
		}
	});

	// Follow the style: a new document or a newly loaded style replaces the text, a change of the
	// same document too unless there are edits, which are kept and marked as outdated.
	let shownKey = '';
	$effect(() => {
		const key = `${targetKey(target)}|${format}`;
		const next = source;
		// A newly loaded style replaces the edits (the user was asked before loading it).
		const loaded = styleStore.origin === 'load';
		if (next === null) return;
		untrack(() => {
			if (key !== shownKey || text === base || loaded) {
				shownKey = key;
				text = base = next;
				outdated = false;
				diagnostics = [];
				problems = [];
			} else if (next !== base) {
				outdated = true;
			}
		});
	});

	/** Parses the text: the style it would make, or the errors. */
	function check(): StyleSpecification | null {
		if (!style) return null;
		try {
			const edited = applyTarget(style, target, format, text);
			diagnostics = [];
			problems = validateStyle(edited).filter((m) => !currentErrors.has(m));
			return edited;
		} catch (e) {
			const err = e instanceof DocumentError ? e : new DocumentError(String(e));
			diagnostics = [{ from: err.from ?? 0, to: err.to ?? err.from ?? 0, message: err.message }];
			problems = [err.message];
			return null;
		}
	}

	function apply({ quiet = false } = {}) {
		if (!dirty) return;
		const edited = check();
		if (!edited || problems.length > 0) {
			if (!quiet) {
				toast.error('The edits cannot be applied', {
					description: problems.slice(0, 5).join('\n')
				});
			}
			return;
		}
		// A renamed layer stays selected.
		if (target.kind === 'layer') {
			const index = style!.layers.findIndex((l) => l.id === target.id);
			const id = edited.layers[index]?.id;
			if (id && id !== target.id) {
				selected = { kind: 'layer', id };
				shownKey = `${targetKey(selected)}|${format}`;
			}
		}
		base = text;
		outdated = false;
		styleStore.apply(edited);
	}

	function discard() {
		if (source === null) return;
		text = base = source;
		outdated = false;
		diagnostics = [];
		problems = [];
	}

	let checkTimer: ReturnType<typeof setTimeout> | undefined;
	let applyTimer: ReturnType<typeof setTimeout> | undefined;
	function onchange(value: string) {
		text = value;
		clearTimeout(checkTimer);
		clearTimeout(applyTimer);
		checkTimer = setTimeout(check, CHECK_DELAY);
		if (autoApply) applyTimer = setTimeout(() => apply({ quiet: true }), AUTO_APPLY_DELAY);
	}

	/** Switches the document, asking first when the edits would be lost. */
	async function switchTo(change: () => void) {
		if (!(await confirmDiscard(dirty))) return;
		clearTimeout(checkTimer);
		clearTimeout(applyTimer);
		base = text; // the edits are discarded: the next document replaces the text
		change();
	}

	function selectScope(value: string) {
		if (value && value !== scope) void switchTo(() => (scope = value as Scope));
	}

	function selectFormat(value: string) {
		if (value && value !== format) void switchTo(() => (format = value as Format));
	}

	function selectTarget(t: Target) {
		if (targetKey(t) !== targetKey(selected)) void switchTo(() => (selected = t));
	}

	async function copy() {
		await navigator.clipboard.writeText(text);
		toast.success(`Copied ${targetFileName(target, format)}`);
	}
</script>

<div class="flex h-full min-h-0 flex-col bg-background">
	<div class="flex flex-wrap items-center gap-2 border-b p-2">
		<ToggleGroup.Root
			type="single"
			variant="outline"
			size="sm"
			value={scope}
			onValueChange={selectScope}
		>
			<ToggleGroup.Item value="files" aria-label="Split files" class="text-xs">
				<FilesIcon class="size-3.5" /> Split files
			</ToggleGroup.Item>
			<ToggleGroup.Item value="style" aria-label="Whole style" class="text-xs">
				<BracesIcon class="size-3.5" /> Whole style
			</ToggleGroup.Item>
		</ToggleGroup.Root>
		<ToggleGroup.Root
			type="single"
			variant="outline"
			size="sm"
			value={format}
			onValueChange={selectFormat}
		>
			<ToggleGroup.Item value="yaml" class="text-xs">YAML</ToggleGroup.Item>
			<ToggleGroup.Item value="json" class="text-xs">JSON</ToggleGroup.Item>
		</ToggleGroup.Root>

		<div class="ml-auto flex items-center gap-2">
			<div class="flex items-center gap-1.5">
				<Switch id="auto-apply" size="sm" bind:checked={autoApply} />
				<Label for="auto-apply" class="text-xs font-normal">Auto apply</Label>
			</div>
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<Button {...props} variant="ghost" size="icon-sm" onclick={copy} aria-label="Copy">
							<CopyIcon />
						</Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content>Copy this file</Tooltip.Content>
			</Tooltip.Root>
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="ghost"
							size="icon-sm"
							disabled={!dirty}
							onclick={discard}
							aria-label="Discard the edits"
						>
							<RotateCcwIcon />
						</Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content>Discard the edits</Tooltip.Content>
			</Tooltip.Root>
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<Button {...props} size="sm" disabled={!dirty} onclick={() => apply()}>
							<PlayIcon /> Apply
						</Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content>Apply to the map (⌘S / Ctrl+S)</Tooltip.Content>
			</Tooltip.Root>
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="ghost"
							size="icon-sm"
							onclick={onclose}
							aria-label="Hide the editor"
						>
							{#if side === 'bottom'}<PanelBottomCloseIcon />{:else}<PanelRightCloseIcon />{/if}
						</Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content>Hide the editor</Tooltip.Content>
			</Tooltip.Root>
		</div>
	</div>

	{#if outdated}
		<div
			class="flex items-center gap-2 border-b bg-amber-50 px-3 py-1.5 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100"
		>
			<span class="flex-1">The style changed on the map while you were editing.</span>
			<Button variant="outline" size="xs" onclick={discard}>
				<RefreshCwIcon /> Load the latest
			</Button>
		</div>
	{/if}

	<div class="flex min-h-0 flex-1">
		{#if scope === 'files' && style}
			<div class="w-48 shrink-0 border-r">
				<LayerFileList layers={style.layers} {selected} {format} onselect={selectTarget} />
			</div>
		{/if}
		<div class="flex min-w-0 flex-1 flex-col">
			<CodeEditor
				value={text}
				{format}
				{diagnostics}
				readonly={!style}
				{onchange}
				onsave={() => apply()}
				class="flex-1"
			/>
		</div>
	</div>

	<div class="flex items-center gap-2 border-t px-3 py-1 text-[11px] text-muted-foreground">
		<span class="truncate font-mono">{targetFileName(target, format)}</span>
		{#if dirty}<span class="text-amber-600">● edited</span>{/if}
		{#if problems.length > 0}
			<span class="ml-auto truncate text-destructive" title={problems.join('\n')}>
				{problems.length} problem{problems.length > 1 ? 's' : ''}: {problems[0]}
			</span>
		{/if}
	</div>
</div>
