/// <reference types="svelte" />

export interface InlineNotificationProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Set the type of notification
   * @default "inline"
   */
  notificationType?: "toast" | "inline";

  /**
   * Specify the kind of notification
   * @default "error"
   */
  kind?: "error" | "info" | "info-square" | "success" | "warning" | "warning-alt";

  /**
   * Set to `true` to use the low contrast variant
   * @default false
   */
  lowContrast?: boolean;

  /**
   * Set the timeout duration (ms) to hide the notification after opening it
   * @default 0
   */
  timeout?: number;

  /**
   * Set the `role` attribute
   * @default "alert"
   */
  role?: string;

  /**
   * Specify the title text
   * @default "Title"
   */
  title?: string;

  /**
   * Specify the subtitle text
   * @default ""
   */
  subtitle?: string;

  /**
   * Set to `true` to hide the close button
   * @default false
   */
  hideCloseButton?: boolean;

  /**
   * Specify the ARIA label for the icon
   * @default "Closes notification"
   */
  iconDescription?: string;
}

export default class InlineNotification {
  $$prop_def: InlineNotificationProps;
  $$slot_def: {
    default: {};
    actions: {};
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: "close", cb: (event: CustomEvent<any>) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
