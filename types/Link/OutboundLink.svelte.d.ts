import { SvelteComponentTyped } from "svelte";
import type { LinkProps } from "./Link.svelte";

export type OutboundLinkProps = LinkProps & {};

export default class OutboundLink extends SvelteComponentTyped<
  OutboundLinkProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: Record<string, never> }
> {}
