import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["button"];

type $Props = {
  /**
   * Set the type of notification.
   * @default "toast"
   */
  notificationType?: "toast" | "inline";

  /**
   * Specify the icon to render.
   * @default Close
   */
  icon?: any;

  /**
   * Specify the title of the icon.
   * @default undefined
   */
  title?: string;

  /**
   * Specify the ARIA label for the icon
   * @default "Close icon"
   */
  iconDescription?: string;

  [key: `data-${string}`]: any;
};

export type NotificationButtonProps = Omit<$RestProps, keyof $Props> & $Props;

export default class NotificationButton extends SvelteComponentTyped<
  NotificationButtonProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  Record<string, never>
> {}
