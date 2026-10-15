<script>
  /**
   * @restProps {div}
   * @slot {{}} - Actions, such as buttons, under the subtitle.
   * @slot {{}} illustration
   * @slot {{}} subtitle
   */

  /** Specify the title */
  export let title = "";

  /**
   * Specify one or two short lines under the title.
   * Alternatively, use the named slot "subtitle", such as for a link.
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
   * @type {1 | 2 | 3 | 4 | 5 | 6}
   */
  export let headingLevel = 3;

  $: headingTag = `h${headingLevel}`;
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
  <svelte:element this={headingTag} class:bx--empty-state__title={true}>
    {title}
  </svelte:element>
  {#if subtitle || $$slots.subtitle}
    <p class:bx--empty-state__subtitle={true}>
      <slot name="subtitle">{subtitle}</slot>
    </p>
  {/if}
  {#if $$slots.default}
    <div class:bx--empty-state__actions={true}>
      <slot />
    </div>
  {/if}
</div>
