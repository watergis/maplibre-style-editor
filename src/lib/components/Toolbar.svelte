<script lang="ts">
	import DownloadIcon from '@lucide/svelte/icons/download';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import StyleLoader from './StyleLoader.svelte';
	import { copyJson, downloadJson, downloadYaml, downloadZip } from '#lib/actions/export.js';
	import { styleStore } from '#lib/state/style-store.svelte.js';
</script>

<div class="flex h-11 shrink-0 items-center gap-2 border-b bg-muted/40 px-3">
	<StyleLoader />
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					size="sm"
					variant="outline"
					disabled={!styleStore.style}
					aria-label="Export"
				>
					<DownloadIcon /> <span class="hidden sm:inline">Export</span>
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
</div>
