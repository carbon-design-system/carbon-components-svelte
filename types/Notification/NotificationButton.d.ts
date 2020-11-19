/// <reference types="svelte" />

export interface NotificationButtonProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["button"]> {
  /**
   * Set the type of notification
   * @default "toast"
   */
  notificationType?: "toast" | "inline";

  /**
   * Specify the icon from `carbon-icons-svelte` to render
   */
  renderIcon?: typeof import("carbon-icons-svelte").CarbonIcon;

  /**
   * Specify the title of the icon
   */
  title?: string;

  /**
   * Specify the ARIA label for the icon
   * @default "Close icon"
   */
  iconDescription?: string;
}

export default class NotificationButton {
  $$prop_def: NotificationButtonProps;
  $$slot_def: {};

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
