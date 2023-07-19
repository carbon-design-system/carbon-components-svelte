import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface ModalBodyProps extends RestProps {
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
  Record<string, any>,
  { default: {} }
> {}
