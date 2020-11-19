/// <reference types="svelte" />

export interface ComposedModalProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set the size of the composed modal
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

export default class ComposedModal {
  $$prop_def: ComposedModalProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: "transitionend", cb: (event: WindowEventMap["transitionend"]) => void): () => void;
  $on(eventname: "submit", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: "close", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: "open", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
