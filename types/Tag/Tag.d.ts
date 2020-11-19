/// <reference types="svelte" />

export interface TagProps
  extends svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["div"]>,
    svelte.JSX.HTMLAttributes<HTMLElementTagNameMap["span"]> {
  /**
   * Specify the type of tag
   */
  type?:
    | "red"
    | "magenta"
    | "purple"
    | "blue"
    | "cyan"
    | "teal"
    | "green"
    | "gray"
    | "cool-gray"
    | "warm-gray"
    | "high-contrast";

  /**
   * Set to `true` to use filterable variant
   * @default false
   */
  filter?: boolean;

  /**
   * Set to `true` to disable a filterable tag
   * @default false
   */
  disabled?: boolean;

  /**
   * Set to `true` to display the skeleton state
   * @default false
   */
  skeleton?: boolean;

  /**
   * Set the title for the close button in a filterable tag
   * @default "Clear filter"
   */
  title?: string;

  /**
   * Set an id for the filterable tag
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;
}

export default class Tag {
  $$prop_def: TagProps;
  $$slot_def: {
    default: { props: { class: "bx--tag__label" } };
  };

  $on(eventname: "click", cb: (event: WindowEventMap["click"]) => void): () => void;
  $on(eventname: "mouseover", cb: (event: WindowEventMap["mouseover"]) => void): () => void;
  $on(eventname: "mouseenter", cb: (event: WindowEventMap["mouseenter"]) => void): () => void;
  $on(eventname: "mouseleave", cb: (event: WindowEventMap["mouseleave"]) => void): () => void;
  $on(eventname: string, cb: (event: Event) => void): () => void;
}
