import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["nav"];

export interface BreadcrumbProps extends RestProps {
  /**
   * Set to `true` to hide the breadcrumb trailing slash
   * @default false
   */
  noTrailingSlash?: boolean;

  [key: `data-${string}`]: any;
}

export default class Breadcrumb extends SvelteComponentTyped<
  BreadcrumbProps,
  Record<string, any>,
  { default: {} }
> {}
