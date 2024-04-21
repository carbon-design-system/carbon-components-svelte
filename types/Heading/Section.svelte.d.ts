import type { SvelteComponentTyped } from "svelte";

export type SectionLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface SectionProps {
  /**
   * Specify the level the section should start at.
   * @default 1
   */
  level?: SectionLevel;

  /**
   * Specify the tag name
   * @default "section"
   */
  tag?: keyof HTMLElementTagNameMap;
}

export default class Section extends SvelteComponentTyped<
  SectionProps,
  Record<string, any>,
  { default: {} }
> {}
