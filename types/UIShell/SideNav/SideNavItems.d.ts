/// <reference types="svelte" />

export interface SideNavItemsProps {}

export default class SideNavItems {
  $$prop_def: SideNavItemsProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
