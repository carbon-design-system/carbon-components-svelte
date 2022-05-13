/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface ComposedModalProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set the size of the composed modal
   * @default undefined
   */
  size?: "xs" | "sm" | "lg";

  /**
   * Set to `true` to open the modal
   * @default false
   */
  open?: boolean;

  /**
   * Set to `true` to use the danger variant
   * @default false
   */
  danger?: boolean;

  /**
   * Set to `true` to prevent the modal from closing when clicking outside
   * @default false
   */
  preventCloseOnClickOutside?: boolean;

  /**
   * Specify a class for the inner modal
   * @default ""
   */
  containerClass?: string;

  /**
   * Specify a selector to be focused when opening the modal
   * @default "[data-modal-primary-focus]"
   */
  selectorPrimaryFocus?: null | string;

  /**
   * Obtain a reference to the top-level HTML element
   * @default null
   */
  ref?: null | HTMLDivElement;
}

export default class ComposedModal extends SvelteComponentTyped<
  ComposedModalProps,
  {
    transitionend: CustomEvent<{ open: boolean }>;
    keydown: WindowEventMap["keydown"];
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    submit: CustomEvent<null>;
    ["click:button--primary"]: CustomEvent<null>;
    close: CustomEvent<null>;
    open: CustomEvent<null>;
  },
  { default: {} }
> {}
