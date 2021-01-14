/// <reference types="svelte" />

export interface HeadIdentityProps {
  /**
   * Specify the href attribute
   */
  title?: string;

  /**
   * Specify the subtitle attribute
   */
  subtitle?: string;

  /**
   * Specify the imgSrc attribute
   */
  imgSrc?: string;

  /**
   * Set the imgSize of the head
   * @default 'normal'
   */
  imgSize?: "small" | "normal" | "large";

  /**
   * Set the titleSize of the head
   * @default 'normal'
   */
  titleSize?: "small" | "normal" | "large";
}

export default class HeadIdentity {
  $$prop_def: HeadIdentityProps;
  $$slot_def: {
    default: {};
    tabs: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
