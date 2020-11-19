/// <reference types="svelte" />

export interface CopyProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["button"]> {
  /**
   * Set the feedback text shown after clicking the button
   * @default "Copied!"
   */
  feedback?: string;

  /**
   * Set the timeout duration (ms) to display feedback text
   * @default 2000
   */
  feedbackTimeout?: number;

  /**
   * Obtain a reference to the button HTML element
   * @default null
   */
  ref?: null | HTMLButtonElement;
}

export default class Copy {
  $$prop_def: CopyProps;
  $$slot_def: {
    default: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "animationend", cb: (event: WindowEventMap["animationend"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
