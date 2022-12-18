/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface InlineNotificationProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]> {
  /**
   * Specify the kind of notification
   * @default "error"
   */
  kind?:
    | "error"
    | "info"
    | "info-square"
    | "success"
    | "warning"
    | "warning-alt";

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
   * @default ""
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
   * Specify the ARIA label for the status icon
   * @default kind + " icon"
   */
  statusIconDescription?: string;

  /**
   * Specify the ARIA label for the close button
   * @default "Close notification"
   */
  closeButtonDescription?: string;
}

export default class InlineNotification extends SvelteComponentTyped<
  InlineNotificationProps,
  {
    close: CustomEvent<{ timeout: boolean }>;
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  { default: {}; actions: {}; subtitle: {}; title: {} }
> {}
