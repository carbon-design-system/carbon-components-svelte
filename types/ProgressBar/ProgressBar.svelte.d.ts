import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface ProgressBarProps extends RestProps {
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
   * Specify the status
   * @default "active"
   */
  status?: "active" | "finished" | "error";

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

  [key: `data-${string}`]: any;
}

export default class ProgressBar extends SvelteComponentTyped<
  ProgressBarProps,
  Record<string, any>,
  { labelText: {} }
> {}
