<script lang="ts">
	import * as AlertDialog from '#lib/components/ui/alert-dialog/index.js';
	import { confirmState } from '#lib/state/confirm.svelte.js';
</script>

<AlertDialog.Root
	open={confirmState.open}
	onOpenChange={(open) => {
		if (!open) confirmState.answer(false);
	}}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>{confirmState.options.title}</AlertDialog.Title>
			{#if confirmState.options.description}
				<AlertDialog.Description>{confirmState.options.description}</AlertDialog.Description>
			{/if}
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => confirmState.answer(false)}>
				{confirmState.options.cancelLabel ?? 'Cancel'}
			</AlertDialog.Cancel>
			<AlertDialog.Action variant="destructive" onclick={() => confirmState.answer(true)}>
				{confirmState.options.confirmLabel ?? 'OK'}
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
