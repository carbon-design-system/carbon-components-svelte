import { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["div"];

type $Props = {
  /**
   * Specify the kind of notification.
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
   * Specify the ARIA label for the status icon.
   * @default `${kind} icon`
   */
  statusIconDescription?: string;

  /**
   * Specify the ARIA label for the close button
   * @default "Close notification"
   */
  closeButtonDescription?: string;

  /**
   * Set to `true` to show the notification, `false` to hide it.
   * @default true
   */
  open?: boolean;

  actions?: (this: void) => void;

  subtitleChildren?: (this: void) => void;

  titleChildren?: (this: void) => void;

  children?: (this: void) => void;

  [key: `data-${string}`]: any;
};

export type InlineNotificationProps = Omit<$RestProps, keyof $Props> & $Props;

export default class InlineNotification extends SvelteComponentTyped<
  InlineNotificationProps,
  {
    close: CustomEvent<{
      timeout: boolean;
    }>;
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
  },
  {
    default: Record<string, never>;
    actions: Record<string, never>;
    subtitleChildren: Record<string, never>;
    titleChildren: Record<string, never>;
  }
> {}
