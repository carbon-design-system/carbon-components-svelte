/// <reference types="svelte" />

export interface HeadProps {
  /**
   * Set the flexDirection of the head
   * @default 'row'
   */
  flexDirection?: "row" | "row-reverse";

  /**
   * Set the margin of the head
   * @default '20px 0 15px'
   */
  margin?: string;
}

export default class Head {
  $$prop_def: HeadProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
