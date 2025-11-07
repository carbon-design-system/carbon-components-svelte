import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type BreadcrumbItemContext = {};

type $RestProps = SvelteHTMLElements["li"];

type $Props = {
  /**
   * Set the `href` to use an anchor link
   * @default undefined
   */
  href?: string;

  /**
   * Set to `true` if the breadcrumb item represents the current page
   * @default false
   */
  isCurrentPage?: boolean;

  [key: `data-${string}`]: any;
};

export type BreadcrumbItemProps = Omit<$RestProps, keyof $Props> & $Props;

export default class BreadcrumbItem extends SvelteComponentTyped<
  BreadcrumbItemProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: { props?: { ["aria-current"]?: string; class: "bx--link" } } }
> {}
