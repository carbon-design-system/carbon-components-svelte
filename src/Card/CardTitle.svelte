<script>
  /**
   * @restProps {div}
   * @slot {{}}
   * @slot {{}} labelChildren - Text above the title, such as a category.
   * @deprecated use the `labelChildren` slot
   * @slot {{}} label
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

  $: titleClamped = typeof titleTruncate === "number";
  $: labelClamped = typeof labelTruncate === "number";
  $: descriptionClamped = typeof descriptionTruncate === "number";
</script>

<div class:bx--card__title={true} {...$$restProps}>
  {#if $$slots.labelChildren || $$slots.label}
    <div
      class:bx--card__label={true}
      class:bx--card__label--truncate={labelTruncate === true}
      class:bx--card__label--truncate-multi={labelClamped}
      style:--ccs-card-label-line-clamp={typeof labelTruncate === "number"
        ? labelTruncate
        : undefined}
    >
      <slot name="labelChildren"><slot name="label" /></slot>
    </div>
  {/if}
  <span
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
  </span>
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
