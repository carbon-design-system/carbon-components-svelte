import { SvelteComponentTyped } from "svelte";

export type SectionLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type SectionContext = {
  $internalLevel: any;
};

export type SectionProps = {
  /**
   * Specify the heading level the section should start at.
   * When nested, child sections automatically increment from this level.
   * Levels are capped at 6 (h6).
   * @default 1
   * @example
   * ```svelte
   * <Section level={5}>
   *   <Heading>Starts at Heading 5</Heading>
   *   <Section>
   *     <Heading>Heading 6</Heading>
   *   </Section>
   * </Section>
   * ```
   * @default 1
   */
  level?: SectionLevel;

  /**
   * Specify the HTML tag name to render instead of the default `section` element.
   * Useful when you need to use a different semantic element while maintaining
   * the heading level context functionality.
   * @default section
   * @example
   * ```svelte
   * <Section tag="div">
   *   <Heading>Heading 1</Heading>
   * </Section>
   * ```
   *
   * @example
   * ```svelte
   * <Section tag="article">
   *   <Heading>Article Heading</Heading>
   * </Section>
   * ```
   * @default "section"
   */
  tag?: keyof HTMLElementTagNameMap;
};

export default class Section extends SvelteComponentTyped<
  SectionProps,
  Record<string, any>,
  { default: Record<string, never> }
> {}
