<script lang="ts">
	import logo from '#lib/assets/maplibre-logo.svg';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import PanelRightCloseIcon from '@lucide/svelte/icons/panel-right-close';
	import PanelRightOpenIcon from '@lucide/svelte/icons/panel-right-open';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import StyleLoader from './StyleLoader.svelte';
	import { copyJson, downloadJson, downloadYaml, downloadZip } from '#lib/actions/export.js';
	import { styleStore } from '#lib/state/style-store.svelte.js';

	interface Props {
		panelOpen: boolean;
		ontogglepanel: () => void;
	}

	let { panelOpen, ontogglepanel }: Props = $props();
</script>

<header class="flex h-12 shrink-0 items-center gap-3 border-b px-3">
	<div class="flex shrink-0 items-center gap-2">
		<img src={logo} alt="" class="size-6" />
		<h1 class="text-sm font-semibold">MapLibre Style Editor</h1>
	</div>
	<StyleLoader />
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button {...props} size="sm" variant="outline" disabled={!styleStore.style}>
					<DownloadIcon /> Export
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-60">
			<DropdownMenu.Label class="text-xs">{styleStore.name}</DropdownMenu.Label>
			<DropdownMenu.Separator />
			<DropdownMenu.Item onclick={() => downloadJson()}>Style JSON</DropdownMenu.Item>
			<DropdownMenu.Item onclick={() => downloadJson(true)}>
				Style JSON (minified)
			</DropdownMenu.Item>
			<DropdownMenu.Item onclick={downloadYaml}>Style YAML (single file)</DropdownMenu.Item>
			<DropdownMenu.Item onclick={downloadZip}>
				Split YAML files (zip)
				<DropdownMenu.Shortcut class="text-[10px]">style.yml + layers/</DropdownMenu.Shortcut>
			</DropdownMenu.Item>
			<DropdownMenu.Separator />
			<DropdownMenu.Item onclick={copyJson}>Copy style JSON</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					size="icon-sm"
					variant="ghost"
					onclick={ontogglepanel}
					aria-label={panelOpen ? 'Hide the editor' : 'Show the editor'}
				>
					{#if panelOpen}<PanelRightCloseIcon />{:else}<PanelRightOpenIcon />{/if}
				</Button>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content>{panelOpen ? 'Hide the editor' : 'Show the editor'}</Tooltip.Content>
	</Tooltip.Root>
</header>
