/// <reference types="svelte" />
import { SvelteComponent } from "svelte";

export interface TableBodyProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["tbody"]> {}

export default class TableBody extends SvelteComponent<TableBodyProps, {}, { default: {} }> {}
