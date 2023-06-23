/// <reference types="svelte" />
import type { SvelteComponent } from "svelte";
import type { LinkProps } from "./Link.svelte";

export interface OutboundLinkProps extends LinkProps {}

export default class OutboundLink extends SvelteComponent<
  OutboundLinkProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {} }
> {}
