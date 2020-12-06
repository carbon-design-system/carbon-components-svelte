/// <reference types="svelte" />

export interface BreadcrumbItemProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["li"]> {
  /**
   * Set the `href` to use an anchor link
   */
  href?: string;

  /**
   * Set to `true` if the breadcrumb item represents the current page
   * @default false
   */
  isCurrentPage?: boolean;
}

export default class BreadcrumbItem {
  $$prop_def: BreadcrumbItemProps;
  $$slot_def: {
    default: { props?: { ["aria-current"]?: string; class: "bx--link" } };
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
