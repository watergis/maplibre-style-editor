<script lang="ts">
	import logo from '#lib/assets/maplibre-logo.svg';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { siGithub } from 'simple-icons';
	import ThemeToggle from './ThemeToggle.svelte';

	const REPOSITORY_URL = 'https://github.com/watergis/maplibre-style-editor';
</script>

<header class="flex h-12 shrink-0 items-center gap-3 border-b px-3">
	<div class="flex min-w-0 items-center gap-2">
		<img src={logo} alt="" class="size-6 shrink-0" />
		<h1 class="truncate text-sm font-semibold">MapLibre Style Editor</h1>
	</div>
	<div class="ml-auto flex shrink-0 items-center gap-1">
		<ThemeToggle />
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						href={REPOSITORY_URL}
						target="_blank"
						rel="noopener noreferrer"
						size="icon-sm"
						variant="ghost"
						aria-label="GitHub repository"
					>
						<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d={siGithub.path} />
						</svg>
					</Button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content>GitHub repository</Tooltip.Content>
		</Tooltip.Root>
	</div>
</header>
