<script>
  /**
   * @typedef {1 | 2 | 3 | 4 | 5 | 6} SectionLevel
   * @restProps {h1 | h2 | h3 | h4 | h5 | h6}
   */

  /**
   * Heading component that automatically adjusts its semantic heading
   * level based on the nesting level of the `Section` component.
   *
   * The heading level is determined by the context provided by the
   * nearest `Section` component. If no `Section` context is available,
   * it defaults to `h1`. Heading levels are automatically incremented
   * for nested sections and capped at `h6`.
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

  /**
   * Set the visual size using a Carbon type token. The semantic heading
   * level stays driven by `Section` context; this only changes how the
   * heading looks.
   * @type {"heading-01"
   *   | "heading-02"
   *   | "productive-heading-01"
   *   | "productive-heading-02"
   *   | "productive-heading-03"
   *   | "productive-heading-04"
   *   | "productive-heading-05"
   *   | "productive-heading-06"
   *   | "productive-heading-07"
   *   | "expressive-heading-01"
   *   | "expressive-heading-02"
   *   | "expressive-heading-03"
   *   | "expressive-heading-04"
   *   | "expressive-heading-05"
   *   | "expressive-heading-06"
   *   | "display-01"
   *   | "display-02"
   *   | "display-03"
   *   | "display-04"
   *   | undefined}
   */
  export let type = undefined;

  import { getContext } from "svelte";

  /** @type {undefined | SectionLevel} */
  const sectionLevel = getContext("carbon:Section");

  $: tag = `h${sectionLevel ?? 1}`;
  $: headingClass = [type && `bx--type-${type}`, $$restProps.class]
    .filter(Boolean)
    .join(" ");
</script>

<svelte:element this={tag} {...$$restProps} class={headingClass}>
  <slot />
</svelte:element>
