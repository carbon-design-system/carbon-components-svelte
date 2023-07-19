import type { SvelteComponentTyped } from "svelte";
import type { LinkProps } from "./Link.svelte";

export interface OutboundLinkProps extends LinkProps {}

export default class OutboundLink extends SvelteComponentTyped<
  OutboundLinkProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
