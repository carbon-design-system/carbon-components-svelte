import type { SvelteComponentTyped } from "svelte";

export interface LayerProps {
  /**
   * Specify the layer level and override any existing levels based on hierarchy.
   * @default undefined
   */
  level?: 0 | 1 | 2;

  /**
   * Specify the HTML element to render. If none is specified, a `div` is rendered.
   * @default "div"
   */
  as?: typeof import("svelte").SvelteComponent;

  /**
   * Specify the Layer HTML element props
   * @default {}
   */
  layerProps?: import("svelte/elements").HTMLElementAttributes;

  /**
   * Set an id for the Layer component
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;
}

export default class Layer extends SvelteComponentTyped<
  LayerProps,
  Record<string, any>,
  { default: {} }
> {}
