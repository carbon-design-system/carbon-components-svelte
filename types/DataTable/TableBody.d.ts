/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface TableBodyProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["tbody"]> {}

export default class TableBody extends SvelteComponentTyped<
  TableBodyProps,
  {},
  { default: {} }
> {}
