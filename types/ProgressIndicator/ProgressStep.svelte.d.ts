/// <reference types="svelte" />
import type { SvelteComponentTyped } from "svelte";

export interface ProgressStepProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["li"]> {
  /**
   * Set to `true` for the complete variant
   * @default false
   */
  complete?: boolean;

  /**
   * Set to `true` to use the current variant
   * @default false
   */
  current?: boolean;

  /**
   * Set to `true` to disable the progress step
   * @default false
   */
  disabled?: boolean;

  /**
   * Set to `true` to indicate an invalid state
   * @default false
   */
  invalid?: boolean;

  /**
   * Specify the step description
   * @default ""
   */
  description?: string;

  /**
   * Specify the step label
   * @default ""
   */
  label?: string;

  /**
   * Specify the step secondary label
   * @default ""
   */
  secondaryLabel?: string;

  /**
   * Set an id for the top-level element
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;
}

export default class ProgressStep extends SvelteComponentTyped<
  ProgressStepProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    keydown: WindowEventMap["keydown"];
  },
  { default: { props: { class: "bx--progress-label" } } }
> {}
