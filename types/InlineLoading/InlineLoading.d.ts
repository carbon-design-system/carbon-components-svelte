/// <reference types="svelte" />

export interface InlineLoadingProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set the loading status
   * @default "active"
   */
  status?: "active" | "inactive" | "finished" | "error";

  /**
   * Set the loading description
   */
  description?: string;

  /**
   * Specify the ARIA label for the loading icon
   */
  iconDescription?: string;

  /**
   * Specify the timeout delay (ms) after `status` is set to "success"
   * @default 1500
   */
  successDelay?: number;
}

export default class InlineLoading {
  $$prop_def: InlineLoadingProps;
  $$slot_def: {};

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: "success", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
