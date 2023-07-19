import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["a"] & SvelteHTMLElements["p"];

export interface LinkProps extends RestProps {
  /**
   * Specify the size of the link
   * @default undefined
   */
  size?: "sm" | "lg";

  /**
   * Specify the href value
   * @default undefined
   */
  href?: string;

  /**
   * Set to `true` to use the inline variant
   * @default false
   */
  inline?: boolean;

  /**
   * Specify the icon to render
   * `inline` must be `false`
   * @default undefined
   */
  icon?: typeof import("svelte").SvelteComponent<any>;

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

  [key: `data-${string}`]: any;
}

export default class Link extends SvelteComponentTyped<
  LinkProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {}; icon: {} }
> {}
