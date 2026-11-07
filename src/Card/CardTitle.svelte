<script>
  /**
   * @restProps {div}
   * @slot {{}}
   * @slot {{}} labelChildren - Text above the title, such as a category.
   * @slot {{}} description - Text below the title, such as a date.
   * @slot {{}} titleStart - An icon before the title text.
   * @slot {{}} titleEnd - An icon after the title text.
   */

  /**
   * Truncate the title: `true` cuts it to one line with an ellipsis, and
   * a number clamps it to that many lines.
   * @type {boolean | number}
   */
  export let titleTruncate = false;

  /**
   * Specify the maximum width of the title, as any CSS width.
   * Only applies when `titleTruncate` is set.
   */
  export let maxWidth = "100%";

  /**
   * Truncate the `labelChildren` slot. Takes the same values as `titleTruncate`.
   * @type {boolean | number}
   */
  export let labelTruncate = false;

  /**
   * Truncate the `description` slot. Takes the same values as
   * `titleTruncate`.
   * @type {boolean | number}
   */
  export let descriptionTruncate = false;

  /**
   * Specify the heading level of the title, to fit the page outline.
   * Inside a `Section`, defaults to one level below the section's heading;
   * otherwise to 3.
   * @type {1 | 2 | 3 | 4 | 5 | 6 | undefined}
   */
  export let headingLevel = undefined;

  import { getContext, onMount } from "svelte";

  // Undefined outside a `Section`; `$sectionLevel` is read only when it is set.
  /** @type {import("svelte/store").Readable<1 | 2 | 3 | 4 | 5 | 6>} */
  const sectionLevel = getContext("carbon:Section");

  /** @type {undefined | { claimTitle: () => string | undefined; releaseTitle: () => void }} */
  const card = getContext("carbon:Card");

  // A clickable card takes its accessible name from this title.
  const titleId = card?.claimTitle();
  onMount(() => () => {
    if (titleId) card?.releaseTitle();
  });

  $: headingTag = `h${
    headingLevel ?? (sectionLevel ? Math.min($sectionLevel + 1, 6) : 3)
  }`;

  $: titleClamped = typeof titleTruncate === "number";
  $: labelClamped = typeof labelTruncate === "number";
  $: descriptionClamped = typeof descriptionTruncate === "number";
</script>

<div class:bx--card__title={true} {...$$restProps}>
  {#if $$slots.labelChildren}
    <div
      class:bx--card__label={true}
      class:bx--card__label--truncate={labelTruncate === true}
      class:bx--card__label--truncate-multi={labelClamped}
      style:--ccs-card-label-line-clamp={typeof labelTruncate === "number"
        ? labelTruncate
        : undefined}
    >
      <slot name="labelChildren" />
    </div>
  {/if}
  <svelte:element
    this={headingTag}
    id={titleId}
    class:bx--card__title-text-row={true}
    class:bx--card__title-text-row--truncate={titleTruncate === true}
    class:bx--card__title-text-row--truncate-multi={titleClamped}
    class:bx--card__title-text-row--with-start-icon={$$slots.titleStart}
    class:bx--card__title-text-row--with-end-icon={$$slots.titleEnd}
    style:--ccs-card-title-max-width={titleTruncate === false
      ? undefined
      : maxWidth}
    style:--ccs-card-title-line-clamp={typeof titleTruncate === "number"
      ? titleTruncate
      : undefined}
  >
    {#if $$slots.titleStart}
      <span class:bx--card__title-start-icon={true}>
        <slot name="titleStart" />
      </span>
    {/if}
    <slot />
    {#if $$slots.titleEnd}
      <span class:bx--card__title-end-icon={true}>
        <slot name="titleEnd" />
      </span>
    {/if}
  </svelte:element>
  {#if $$slots.description}
    <div
      class:bx--card__description={true}
      class:bx--card__description--truncate={descriptionTruncate === true}
      class:bx--card__description--truncate-multi={descriptionClamped}
      style:--ccs-card-description-line-clamp={typeof descriptionTruncate ===
      "number"
        ? descriptionTruncate
        : undefined}
    >
      <slot name="description" />
    </div>
  {/if}
</div>
