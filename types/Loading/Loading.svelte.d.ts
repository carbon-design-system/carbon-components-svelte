/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface LoadingProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set to `true` to use the small variant
   * @default false
   */
  small?: boolean;

  /**
   * Set to `false` to disable the active state
   * @default true
   */
  active?: boolean;

  /**
   * Set to `false` to disable the overlay
   * @default true
   */
  withOverlay?: boolean;

  /**
   * Specify the label description
   * @default "Active loading indicator"
   */
  description?: string;

  /**
   * Set an id for the label element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;
}

export default class Loading extends SvelteComponentTyped<
  LoadingProps,
  {},
  {}
> {}
