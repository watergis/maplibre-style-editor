<script lang="ts">
	import { mode, resetMode, setMode, userPrefersMode } from 'mode-watcher';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import SunIcon from '@lucide/svelte/icons/sun';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';

	const options = [
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' },
		{ value: 'system', label: 'System' }
	] as const;

	function select(value: string) {
		if (value === 'system') resetMode();
		else if (value === 'light' || value === 'dark') setMode(value);
	}
</script>

<DropdownMenu.Root>
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props: tooltipProps })}
				<DropdownMenu.Trigger {...tooltipProps}>
					{#snippet child({ props })}
						<Button {...props} size="icon-sm" variant="ghost" aria-label="Theme">
							{#if mode.current === 'dark'}<MoonIcon />{:else}<SunIcon />{/if}
						</Button>
					{/snippet}
				</DropdownMenu.Trigger>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content>Theme</Tooltip.Content>
	</Tooltip.Root>
	<DropdownMenu.Content align="end">
		<DropdownMenu.RadioGroup value={userPrefersMode.current} onValueChange={select}>
			{#each options as option (option.value)}
				<DropdownMenu.RadioItem value={option.value}>{option.label}</DropdownMenu.RadioItem>
			{/each}
		</DropdownMenu.RadioGroup>
	</DropdownMenu.Content>
</DropdownMenu.Root>
