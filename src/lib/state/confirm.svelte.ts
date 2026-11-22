export interface ConfirmOptions {
	title: string;
	description?: string;
	confirmLabel?: string;
	cancelLabel?: string;
}

/** A question shown by `ConfirmDialog`, answered through a promise. */
class ConfirmState {
	open = $state(false);
	options = $state<ConfirmOptions>({ title: '' });
	#resolve: ((ok: boolean) => void) | undefined;

	ask(options: ConfirmOptions): Promise<boolean> {
		this.#resolve?.(false);
		this.options = options;
		this.open = true;
		return new Promise((resolve) => (this.#resolve = resolve));
	}

	answer(ok: boolean) {
		this.open = false;
		this.#resolve?.(ok);
		this.#resolve = undefined;
	}
}

export const confirmState = new ConfirmState();

/** Asks whether to go on, when the editor panel has edits not applied yet. */
export const confirmDiscard = (dirty: boolean) =>
	dirty
		? confirmState.ask({
				title: 'Discard the edits?',
				description: 'The editor has edits that are not applied to the map yet.',
				confirmLabel: 'Discard'
			})
		: Promise.resolve(true);
