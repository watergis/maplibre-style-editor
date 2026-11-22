<script lang="ts" module>
	export interface EditorDiagnostic {
		from: number;
		to: number;
		message: string;
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { basicSetup } from 'codemirror';
	import { Annotation, Compartment, EditorState } from '@codemirror/state';
	import { EditorView, keymap } from '@codemirror/view';
	import { indentWithTab } from '@codemirror/commands';
	import { json } from '@codemirror/lang-json';
	import { yaml } from '@codemirror/lang-yaml';
	import { syntaxHighlighting } from '@codemirror/language';
	import { lintGutter, setDiagnostics } from '@codemirror/lint';
	import { oneDarkHighlightStyle } from '@codemirror/theme-one-dark';
	import { mode } from 'mode-watcher';
	import type { Format } from '#lib/editor/documents.js';

	interface Props {
		value: string;
		format: Format;
		diagnostics?: EditorDiagnostic[];
		readonly?: boolean;
		onchange?: (value: string) => void;
		onsave?: () => void;
		class?: string;
	}

	let {
		value,
		format,
		diagnostics = [],
		readonly = false,
		onchange,
		onsave,
		class: className = ''
	}: Props = $props();

	/** Marks changes made from `value`, which are not reported by `onchange`. */
	const External = Annotation.define<boolean>();

	const language = new Compartment();
	const editable = new Compartment();
	const colorScheme = new Compartment();
	/** The dark one turns on the dark variants of CodeMirror and a highlight style for dark backgrounds. */
	const colorSchemeOf = (dark: boolean) =>
		dark ? [EditorView.theme({}, { dark: true }), syntaxHighlighting(oneDarkHighlightStyle)] : [];
	const languageOf = (f: Format) => (f === 'json' ? json() : yaml());

	let parent: HTMLDivElement;
	let view = $state.raw<EditorView>();

	const theme = EditorView.theme({
		'&': { height: '100%', fontSize: '12px', backgroundColor: 'var(--background)' },
		'.cm-scroller': { fontFamily: 'var(--font-mono, ui-monospace, monospace)' },
		'.cm-gutters': {
			backgroundColor: 'var(--muted)',
			color: 'var(--muted-foreground)',
			borderRight: '1px solid var(--border)'
		},
		'.cm-activeLine': {
			backgroundColor: 'color-mix(in oklab, var(--foreground) 5%, transparent)'
		},
		'.cm-activeLineGutter': { backgroundColor: 'var(--accent)', color: 'var(--foreground)' },
		'&.cm-focused': { outline: 'none' }
	});

	onMount(() => {
		const v = new EditorView({
			parent,
			state: EditorState.create({
				doc: value,
				extensions: [
					basicSetup,
					lintGutter(),
					keymap.of([
						{
							key: 'Mod-s',
							preventDefault: true,
							run: () => {
								onsave?.();
								return true;
							}
						},
						indentWithTab
					]),
					language.of(languageOf(format)),
					editable.of(EditorState.readOnly.of(readonly)),
					theme,
					colorScheme.of(colorSchemeOf(mode.current === 'dark')),
					EditorView.updateListener.of((update) => {
						if (!update.docChanged) return;
						if (update.transactions.some((tr) => tr.annotation(External))) return;
						onchange?.(update.state.doc.toString());
					})
				]
			})
		});
		view = v;
		return () => {
			v.destroy();
			view = undefined;
		};
	});

	// A new value from outside replaces the text, keeping the cursor and the scroll as far as possible.
	$effect(() => {
		const next = value;
		if (!view) return;
		const current = view.state.doc.toString();
		if (next === current) return;
		const { scrollTop } = view.scrollDOM;
		const head = Math.min(view.state.selection.main.head, next.length);
		view.dispatch({
			changes: { from: 0, to: current.length, insert: next },
			selection: { anchor: head },
			annotations: External.of(true)
		});
		view.scrollDOM.scrollTop = scrollTop;
	});

	$effect(() => {
		view?.dispatch({ effects: language.reconfigure(languageOf(format)) });
	});

	$effect(() => {
		const dark = mode.current === 'dark';
		view?.dispatch({ effects: colorScheme.reconfigure(colorSchemeOf(dark)) });
	});

	$effect(() => {
		view?.dispatch({ effects: editable.reconfigure(EditorState.readOnly.of(readonly)) });
	});

	$effect(() => {
		if (!view) return;
		const length = view.state.doc.length;
		const items = diagnostics.map((d) => ({
			from: Math.min(d.from, length),
			to: Math.min(Math.max(d.to, d.from), length),
			message: d.message,
			severity: 'error' as const
		}));
		view.dispatch(setDiagnostics(view.state, items));
	});
</script>

<div bind:this={parent} class="h-full min-h-0 overflow-hidden {className}"></div>
