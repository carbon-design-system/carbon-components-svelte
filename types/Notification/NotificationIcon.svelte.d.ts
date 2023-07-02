/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface NotificationIconProps {
  /**
   * Specify the kind of notification icon
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
   * Set the type of notification
   * @default "toast"
   */
  notificationType?: "toast" | "inline";

  /**
   * Specify the ARIA label for the icon
   * @default undefined
   */
  iconDescription: undefined;
}

export default class NotificationIcon extends SvelteComponentTyped<
  NotificationIconProps,
  {},
  {}
> {}
