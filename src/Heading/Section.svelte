<script>
  /**
   * @typedef {1 | 2 | 3 | 4 | 5 | 6} SectionLevel
   */

  /**
   * Section component that provides heading level context to nested `Heading` components.
   *
   * The section automatically increments the heading level for nested sections,
   * ensuring proper semantic heading hierarchy. Heading levels are capped at `h6`.
   *
   * @example
   * ```svelte
   * <Section>
   *   <Heading>Heading 1</Heading>
   *   <Section>
   *     <Heading>Heading 2</Heading>
   *   </Section>
   * </Section>
   * ```
   */

  /**
   * Specify the heading level the section should start at.
   * When nested, child sections automatically increment from this level.
   * Levels are capped at 6 (h6).
   *
   * @type {SectionLevel}
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
   */
  export let level = 1;

  /**
   * Specify the HTML tag name to render instead of the default `section` element.
   * Useful when you need to use a different semantic element while maintaining
   * the heading level context functionality.
   *
   * @type {keyof HTMLElementTagNameMap}
   * @default "section"
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
   */
  export let tag = "section";

  import { getContext, setContext } from "svelte";
  import { writable } from "svelte/store";

  /** @type {undefined | SectionLevel} */
  const parentLevel = getContext("Section");

  /** @type {import ("svelte/store").Writable<SectionLevel>} */
  const internalLevel = writable(level);

  if (typeof parentLevel === "number") {
    internalLevel.set(Math.min(parentLevel + 1, 6));
  }

  // Custom level should override the inferred parent level.
  if (level !== 1) {
    internalLevel.set(level);
  }

  setContext("Section", $internalLevel);
</script>

<svelte:element this="{tag}"><slot /></svelte:element>
