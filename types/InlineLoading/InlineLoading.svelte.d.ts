import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface InlineLoadingProps extends RestProps {
  /**
   * Set the loading status
   * @default "active"
   */
  status?: "active" | "inactive" | "finished" | "error";

  /**
   * Set the loading description
   * @default undefined
   */
  description?: string;

  /**
   * Specify a description for the loading icon.
   * Defaults to the `status` value for the
   *  "error" and "finished" states.
   * @default undefined
   */
  iconDescription?: string;

  /**
   * Specify the timeout delay (ms) after `status` is set to "finished".
   * The `on:success` event will be dispatched after this delay.
   * @default 1500
   */
  successDelay?: number;

  [key: `data-${string}`]: any;
}

export default class InlineLoading extends SvelteComponentTyped<
  InlineLoadingProps,
  { success: CustomEvent<null> },
  {}
> {}
