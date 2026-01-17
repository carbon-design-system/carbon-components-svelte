import { SvelteComponentTyped } from "svelte";

export type ToolbarContentProps = {
  children?: (this: void) => void;
};

export default class ToolbarContent extends SvelteComponentTyped<
  ToolbarContentProps,
  Record<string, any>,
  { default: Record<string, never> }
> {}
