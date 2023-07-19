import type { SvelteComponentTyped } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

type RestProps = SvelteHTMLElements["div"];

export interface AspectRatioProps extends RestProps {
  /**
   * Specify the aspect ratio
   * @default "2x1"
   */
  ratio?:
    | "2x1"
    | "2x3"
    | "16x9"
    | "4x3"
    | "1x1"
    | "3x4"
    | "3x2"
    | "9x16"
    | "1x2";

  [key: `data-${string}`]: any;
}

export default class AspectRatio extends SvelteComponentTyped<
  AspectRatioProps,
  Record<string, any>,
  { default: {} }
> {}
