import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface InlineLoadingProps extends RestProps {
  /**
   * Set the loading status
   * @default "active"
   */
  status?: "active" | "inactive" | "finished" | "error";

  /**
   * Set the loading description
   * @default undefined
   */
  description?: string;

  /**
   * Specify a description for the loading icon.
   * Defaults to the `status` prop for the "error" and "finished" states
   * @default undefined
   */
  iconDescription?: string;

  /**
   * Specify the timeout delay (ms) after `status` is set to "success"
   * @default 1500
   */
  successDelay?: number;

  [key: `data-${string}`]: any;
}

export default class InlineLoading extends SvelteComponentTyped<
  InlineLoadingProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    success: CustomEvent<null>;
  },
  {}
> {}
