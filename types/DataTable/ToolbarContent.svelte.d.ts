import type { SvelteComponentTyped } from "svelte";

export type ToolbarContentProps = Record<string, never>;

export default class ToolbarContent extends SvelteComponentTyped<
  ToolbarContentProps,
  Record<string, any>,
  { default: Record<string, never> }
> {}
