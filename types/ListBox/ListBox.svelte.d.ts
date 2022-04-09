/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface ListBoxProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set the size of the list box
   * @default undefined
   */
  size?: "sm" | "xl";

  /**
   * Set the type of the list box
   * @default "default"
   */
  type?: "default" | "inline";

  /**
   * Set to `true` to open the list box
   * @default false
   */
  open?: boolean;

  /**
   * Set to `true` to enable the light variant
   * @default false
   */
  light?: boolean;

  /**
   * Set to `true` to disable the list box
   * @default false
   */
  disabled?: boolean;

  /**
   * Set to `true` to indicate an invalid state
   * @default false
   */
  invalid?: boolean;

  /**
   * Specify the invalid state text
   * @default ""
   */
  invalidText?: string;

  /**
   * Set to `true` to indicate an warning state
   * @default false
   */
  warn?: boolean;

  /**
   * Specify the warning state text
   * @default ""
   */
  warnText?: string;
}

export default class ListBox extends SvelteComponentTyped<
  ListBoxProps,
  { keydown: WindowEventMap["keydown"]; click: WindowEventMap["click"] },
  { default: {} }
> {}
