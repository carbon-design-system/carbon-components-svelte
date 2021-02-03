/// <reference types="svelte" />
import { LinkProps } from "./Link";

export interface OutboundLinkProps extends LinkProps {}

export default class OutboundLink {
  $$prop_def: OutboundLinkProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
