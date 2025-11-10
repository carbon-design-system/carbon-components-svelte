import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type $RestProps = SvelteHTMLElements["button"];

type $Props = {
  /**
   * Set to `true` to open the panel
   * @default false
   */
  isOpen?: boolean;

  /**
   * Specify the icon to render when the action panel is closed.
   * @default Switcher
   */
  icon?: any;

  /**
   * Specify the icon to render when the action panel is open.
   * @default Close
   */
  closeIcon?: any;

  /**
   * Specify the text displayed next to the icon.
   * Alternatively, use the named slot "text" (e.g., `<div slot="text">...</div>`)
   * @default undefined
   */
  text?: string;

  /**
   * Specify an icon tooltip. The tooltip will not be displayed
   * if either the `text` prop or a named slot="text" is used
   * @default undefined
   */
  iconDescription?: string;

  /**
   * Set the alignment of the tooltip relative to the icon.
   * Only applies when `iconDescription` is provided
   * @default "center"
   */
  tooltipAlignment?: "start" | "center" | "end";

  /**
   * Obtain a reference to the button HTML element
   * @default null
   */
  ref?: null | HTMLButtonElement;

  /**
   * Customize the panel transition (i.e., `transition:slide`).
   * Set to `false` to disable the transition
   * @default { duration: 200 }
   */
  transition?: false | import("svelte/transition").SlideParams;

  /**
   * Set to `true` to prevent the panel from closing when clicking outside
   * @default false
   */
  preventCloseOnClickOutside?: boolean;

  [key: `data-${string}`]: any;
};

export type HeaderActionProps = Omit<$RestProps, keyof $Props> & $Props;

export default class HeaderAction extends SvelteComponentTyped<
  HeaderActionProps,
  {
    open: CustomEvent<null>;
    close: CustomEvent<null>;
    click: WindowEventMap["click"];
  },
  {
    closeIcon: Record<string, never>;
    icon: Record<string, never>;
    text: Record<string, never>;
    default: Record<string, never>;
  }
> {}
