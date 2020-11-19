/// <reference types="svelte" />

export interface ProgressStepProps extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["li"]> {
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

export default class ProgressStep {
  $$prop_def: ProgressStepProps;
  $$slot_def: {
    default: { props: { class: "bx--progress-label" } };
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: "keydown", cb: (event: WindowEventMap["keydown"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
