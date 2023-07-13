/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface ModalBodyProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set to `true` if the modal contains form elements
   * @default false
   */
  hasForm?: boolean;

  /**
   * Set to `true` if the modal contains scrolling content
   * @default false
   */
  hasScrollingContent?: boolean;

  [key: `data-${string}`]: any;
}

export default class ModalBody extends SvelteComponentTyped<
  ModalBodyProps,
  {},
  { default: {} }
> {}
