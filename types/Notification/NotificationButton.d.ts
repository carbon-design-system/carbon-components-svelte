/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface NotificationButtonProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["button"]> {
  /**
   * Set the type of notification
   * @default "toast"
   */
  notificationType?: "toast" | "inline";

  /**
   * Specify the icon from `carbon-icons-svelte` to render
   */
  icon?: typeof import("carbon-icons-svelte").CarbonIcon;

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

export default class NotificationButton extends SvelteComponentTyped<
  NotificationButtonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {}
> {}
