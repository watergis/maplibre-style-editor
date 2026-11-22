<script lang="ts">
	import './layout.css';
	import logo from '#lib/assets/maplibre-logo.svg';
	import { Toaster } from '#lib/components/ui/sonner/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={logo} />
	<title>MapLibre Style Editor</title>
</svelte:head>

<Tooltip.Provider>
	{@render children()}
</Tooltip.Provider>
<Toaster richColors closeButton />
