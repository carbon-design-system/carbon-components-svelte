/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

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
   * @default "default"
   */
  size?: "sm" | "default";

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
   * Set to `true` to render a `button` element instead of a `div`
   * @default false
   */
  interactive?: boolean;

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
   * Specify the icon from `carbon-icons-svelte` to render
   */
  icon?: typeof import("carbon-icons-svelte").CarbonIcon;

  /**
   * Set an id for the filterable tag
   * @default "ccs-" + Math.random().toString(36)
   */
  id?: string;
}

export default class Tag extends SvelteComponentTyped<
  TagProps,
  {
    click: WindowEventMap["click"];
    mouseover: WindowEventMap["mouseover"];
    mouseenter: WindowEventMap["mouseenter"];
    mouseleave: WindowEventMap["mouseleave"];
    close: CustomEvent<any>;
  },
  { default: { props: { class: "bx--tag__label" } } }
> {}
