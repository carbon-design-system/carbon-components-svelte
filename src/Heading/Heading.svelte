<script>
  /**
   * @typedef {1 | 2 | 3 | 4 | 5 | 6} SectionLevel
   * @restProps {h1 | h2 | h3 | h4 | h5 | h6}
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

  /**
   * Set the visual size using a Carbon type token. The semantic heading level
   * stays driven by `Section` context; this only changes how the heading looks.
   * @type {"heading-compact-01" | "heading-compact-02" | "heading-01" | "heading-02" | "heading-03" | "heading-04" | "heading-05" | "heading-06" | "heading-07" | "fluid-heading-03" | "fluid-heading-04" | "fluid-heading-05" | "fluid-heading-06" | "fluid-display-01" | "fluid-display-02" | "fluid-display-03" | "fluid-display-04" | undefined}
   */
  export let type = undefined;

  import { getContext } from "svelte";
  import { readable } from "svelte/store";

  /** @type {import("svelte/store").Readable<SectionLevel>} */
  const sectionLevel = getContext("carbon:Section") ?? readable(1);

  $: tag = `h${$sectionLevel}`;
  $: headingClass = [type && `bx--type-${type}`, $$restProps.class]
    .filter(Boolean)
    .join(" ");
</script>

<svelte:element this={tag} {...$$restProps} class={headingClass}>
  <slot />
</svelte:element>
