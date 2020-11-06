/// <reference types="svelte" />

export interface LinkProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["p"]> {
  /**
   * Specify the size of the link
   */
  size?: "sm" | "lg";

  /**
   * Specify the href value
   */
  href?: string;

  /**
   * Set to `true` to use the inline variant
   * @default false
   */
  inline?: boolean;

  /**
   * Set to `true` to disable the checkbox
   * @default false
   */
  disabled?: boolean;

  /**
   * Set to `true` to allow visited styles
   * @default false
   */
  visited?: boolean;

  /**
   * Obtain a reference to the top-level HTML element
   * @default null
   */
  ref?: null | HTMLAnchorElement | HTMLParagraphElement;
}

export default class Link {
  $$prop_def: LinkProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
