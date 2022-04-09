/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface ProgressBarProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Specify the current value
   * @default undefined
   */
  value?: number;

  /**
   * Specify the maximum value
   * @default 100
   */
  max?: number;

  /**
   * Specify the kind of progress bar
   * @default "default"
   */
  kind?: "default" | "inline" | "indented";

  /**
   * Specify the size
   * @default "md"
   */
  size?: "sm" | "md";

  /**
   * Specify the label text
   * @default ""
   */
  labelText?: string;

  /**
   * Set to `true` to visually hide the label text
   * @default false
   */
  hideLabel?: boolean;

  /**
   * Specify the helper text
   * @default ""
   */
  helperText?: string;

  /**
   * Set an id for the progress bar element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;
}

export default class ProgressBar extends SvelteComponentTyped<
  ProgressBarProps,
  {},
  { labelText: {} }
> {}
