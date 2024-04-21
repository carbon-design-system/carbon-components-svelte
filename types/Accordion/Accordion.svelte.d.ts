import type { SvelteComponentTyped } from "svelte";

export interface AccordionProps {
  /**
   * Specify the alignment of the accordion item chevron icon.
   * @default "end"
   */
  align?: "start" | "end";

  /**
   * Set to `true` to flush the accordion content text.
   *
   * **Note**: does not work with `align="start"`.
   * @default false
   */
  flush?: boolean;

  /**
   * Specify the size of the accordion.
   * @default "md"
   */
  size?: "sm" | "md" | "lg";

  /**
   * Set to `true` to disable all accordion items.
   * @default false
   */
  disabled?: boolean;
}

export default class Accordion extends SvelteComponentTyped<
  AccordionProps,
  Record<string, any>,
  { default: {} }
> {}
