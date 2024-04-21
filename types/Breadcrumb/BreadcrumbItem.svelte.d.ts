import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["li"];

export interface BreadcrumbItemProps extends RestProps {
  /**
   * Set the `href` to use an anchor link.
   * The `Link` component is used if `href` is set.
   * @default undefined
   */
  href?: string;

  /**
   * Set to `true` if the breadcrumb item represents the current page
   * @default false
   */
  isCurrentPage?: boolean;

  [key: `data-${string}`]: any;
}

export default class BreadcrumbItem extends SvelteComponentTyped<
  BreadcrumbItemProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {
    default: {
      props?: Pick<AriaAttributes, "aria-current"> & { class: "bx--link" };
    };
  }
> {}
