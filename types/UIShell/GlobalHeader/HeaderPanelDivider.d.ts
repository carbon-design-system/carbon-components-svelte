/// <reference types="svelte" />

export interface HeaderPanelDividerProps {}

export default class HeaderPanelDivider {
  $$prop_def: HeaderPanelDividerProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
