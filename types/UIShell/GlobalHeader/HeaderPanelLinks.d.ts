/// <reference types="svelte" />

export interface HeaderPanelLinksProps {}

export default class HeaderPanelLinks {
  $$prop_def: HeaderPanelLinksProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
