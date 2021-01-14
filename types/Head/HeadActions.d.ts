/// <reference types="svelte" />

export interface HeadActionsProps {
  /**
   * Set the width of the head actions
   * @default "100%"
   */
  width?: string;
}

export default class HeadActions {
  $$prop_def: HeadActionsProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
