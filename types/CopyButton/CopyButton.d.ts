/// <reference types="svelte" />

export default class CopyButton {
  $$prop_def: {
    /**
     * Set the title and ARIA label for the copy button
     * @default "Copy to clipboard"
     */
    iconDescription?: string;
  };

  $$slot_def: {};

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "animationend", cb: (event: WindowEventMap["animationend"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
