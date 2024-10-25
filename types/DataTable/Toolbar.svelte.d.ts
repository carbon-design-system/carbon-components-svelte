import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["section"];

type $Props = {
  /**
   * Specify the toolbar size
   * @default "default"
   */
  size?: "sm" | "default";

  [key: `data-${string}`]: any;
};

export type ToolbarProps = Omit<$RestProps, keyof $Props> & $Props;

export default class Toolbar extends SvelteComponentTyped<
  ToolbarProps,
  Record<string, any>,
  { default: {} }
> {}
