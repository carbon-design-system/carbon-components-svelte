/// <reference types="svelte" />

export interface CopyButtonProps {
  /**
   * Set the title and ARIA label for the copy button
   * @default "Copy to clipboard"
   */
  iconDescription?: string;
}

export default class CopyButton {
  $$prop_def: CopyButtonProps;
  $$slot_def: {};

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "animationend", cb: (event: WindowEventMap["animationend"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
