import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["section"];

export interface ToolbarProps extends RestProps {
  /**
   * Specify the toolbar size
   * @default "default"
   */
  size?: "sm" | "default";

  [key: `data-${string}`]: any;
}

export default class Toolbar extends SvelteComponentTyped<
  ToolbarProps,
  Record<string, any>,
  { default: {} }
> {}
