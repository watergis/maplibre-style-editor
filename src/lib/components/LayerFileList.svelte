<script lang="ts">
	import type { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';
	import FileCogIcon from '@lucide/svelte/icons/file-cog';
	import SearchIcon from '@lucide/svelte/icons/search';
	import { Input } from '#lib/components/ui/input/index.js';
	import { ScrollArea } from '#lib/components/ui/scroll-area/index.js';
	import { targetFileName, targetKey, type Format, type Target } from '#lib/editor/documents.js';
	import { cn } from '#lib/utils.js';

	interface Props {
		layers: LayerSpecification[];
		selected: Target;
		format: Format;
		onselect: (target: Target) => void;
	}

	let { layers, selected, format, onselect }: Props = $props();

	let query = $state('');

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return layers;
		return layers.filter(
			(l) =>
				l.id.toLowerCase().includes(q) ||
				l.type.includes(q) ||
				('source-layer' in l && l['source-layer']?.toLowerCase().includes(q))
		);
	});

	const selectedKey = $derived(targetKey(selected));
	const root: Target = { kind: 'root' };

	const itemClass = (active: boolean) =>
		cn(
			'flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left text-xs hover:bg-accent',
			active && 'bg-accent font-medium'
		);
</script>

<div class="flex h-full min-h-0 flex-col">
	<div class="relative border-b p-2">
		<SearchIcon
			class="pointer-events-none absolute top-1/2 left-4 size-3.5 -translate-y-1/2 text-muted-foreground"
		/>
		<Input bind:value={query} placeholder="Filter layers" class="h-7 pl-7 text-xs" />
	</div>
	<ScrollArea class="min-h-0 flex-1">
		<ul class="p-1">
			<li>
				<button
					type="button"
					class={itemClass(selectedKey === 'root')}
					onclick={() => onselect(root)}
				>
					<FileCogIcon class="size-3.5 shrink-0" />
					<span class="truncate">{targetFileName(root, format)}</span>
				</button>
			</li>
			{#each filtered as layer (layer.id)}
				{@const target = { kind: 'layer', id: layer.id } as Target}
				<li>
					<button
						type="button"
						class={itemClass(selectedKey === targetKey(target))}
						title={layer.id}
						onclick={() => onselect(target)}
					>
						<span class="min-w-0 flex-1 truncate">{layer.id}</span>
						<span class="shrink-0 text-[10px] text-muted-foreground">{layer.type}</span>
					</button>
				</li>
			{/each}
		</ul>
	</ScrollArea>
	<div class="border-t px-2 py-1 text-[10px] text-muted-foreground">
		{filtered.length} / {layers.length} layers
	</div>
</div>
