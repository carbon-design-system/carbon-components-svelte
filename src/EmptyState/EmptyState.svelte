<script>
  /**
   * @restProps {div}
   * @slot {{}} - Actions, such as buttons, under the subtitle.
   * @slot {{}} illustration - Decorative art above the title, hidden from assistive technology.
   * @slot {{}} titleChildren
   * @slot {{}} subtitleChildren
   */

  /**
   * Specify the title.
   * Alternatively, use the named slot "titleChildren".
   */
  export let title = "";

  /**
   * Specify one or two short lines under the title.
   * Alternatively, use the named slot "subtitleChildren", such as for a link.
   */
  export let subtitle = "";

  /**
   * Set the size: `"lg"` for a page or panel, `"sm"` for a card, drawer or
   * table body.
   * @type {"sm" | "lg"}
   */
  export let size = "lg";

  /**
   * Specify the heading level of the title, to fit the page outline.
   * Inside a `Section`, defaults to one level below the section's heading;
   * otherwise to 3.
   * @type {1 | 2 | 3 | 4 | 5 | 6 | undefined}
   */
  export let headingLevel = undefined;

  import { getContext } from "svelte";

  /** @type {undefined | import("svelte/store").Readable<1 | 2 | 3 | 4 | 5 | 6>} */
  const sectionLevel = getContext("carbon:Section");

  $: headingTag = `h${
    headingLevel ?? (sectionLevel ? Math.min($sectionLevel + 1, 6) : 3)
  }`;
</script>

<div
  class:bx--empty-state={true}
  class:bx--empty-state--sm={size === "sm"}
  {...$$restProps}
>
  {#if $$slots.illustration}
    <div class:bx--empty-state__illustration={true} aria-hidden="true">
      <slot name="illustration" />
    </div>
  {/if}
  {#if title || $$slots.titleChildren}
    <svelte:element this={headingTag} class:bx--empty-state__title={true}>
      <slot name="titleChildren">{title}</slot>
    </svelte:element>
  {/if}
  {#if subtitle || $$slots.subtitleChildren}
    <p class:bx--empty-state__subtitle={true}>
      <slot name="subtitleChildren">{subtitle}</slot>
    </p>
  {/if}
  {#if $$slots.default}
    <div class:bx--empty-state__actions={true}>
      <slot />
    </div>
  {/if}
</div>
