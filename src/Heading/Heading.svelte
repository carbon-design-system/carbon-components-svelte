<script>
  /**
   * @typedef {1 | 2 | 3 | 4 | 5 | 6} SectionLevel
   */

  /**
   * Heading component that automatically adjusts its semantic heading level
   * based on the nesting level of the `Section` component.
   *
   * The heading level is determined by the context provided by the nearest
   * `Section` component. If no `Section` context is available, it defaults to `h1`.
   * Heading levels are automatically incremented for nested sections and capped at `h6`.
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
   *
   * @example
   * ```svelte
   * <!-- Heading without Section defaults to h1 -->
   * <Heading>Standalone Heading</Heading>
   * ```
   */

  import { getContext } from "svelte";

  /** @type {undefined | SectionLevel} */
  const sectionLevel = getContext("carbon:Section");

  $: tag = `h${sectionLevel ?? 1}`;
</script>

<svelte:element this={tag}>
  <slot />
</svelte:element>
