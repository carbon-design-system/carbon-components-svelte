<script>
  /**
   * @restProps {div}
   * @slot {{}}
   * @slot {{}} label - Rendered above the title text.
   * @slot {{}} description - Rendered below the title text.
   * @slot {{}} titleStart - Leading icon or content, before the title text.
   * @slot {{}} titleEnd - Trailing icon or content, after the title text.
   */

  /**
   * Enable truncation on the title text: `true` truncates to a single line
   * with an ellipsis, a number clamps to that many lines.
   * @type {boolean | number}
   */
  export let titleTruncate = false;

  /**
   * Maximum width applied to the title text row when `titleTruncate` is set.
   */
  export let maxWidth = "100%";

  /**
   * Enable truncation on the `label` slot, same values as `titleTruncate`.
   * @type {boolean | number}
   */
  export let labelTruncate = false;

  /**
   * Enable truncation on the `description` slot, same values as
   * `titleTruncate`.
   * @type {boolean | number}
   */
  export let descriptionTruncate = false;

  $: isTitleMulti = typeof titleTruncate === "number";
  $: isLabelMulti = typeof labelTruncate === "number";
  $: isDescriptionMulti = typeof descriptionTruncate === "number";
</script>

<div class:bx--card__title={true} {...$$restProps}>
  {#if $$slots.label}
    <div
      class:bx--card__label={true}
      class:bx--card__label--truncate={labelTruncate === true}
      class:bx--card__label--truncate-multi={isLabelMulti}
      style:--bx--card--label-line-clamp={isLabelMulti
        ? labelTruncate
        : undefined}
    >
      <slot name="label" />
    </div>
  {/if}
  <span
    class:bx--card__title-text-row={true}
    class:bx--card__title-text-row--truncate={titleTruncate === true}
    class:bx--card__title-text-row--truncate-multi={isTitleMulti}
    class:bx--card__title-text-row--with-start-icon={$$slots.titleStart}
    class:bx--card__title-text-row--with-end-icon={$$slots.titleEnd}
    style:--bx--card--title-max-width={titleTruncate === false
      ? undefined
      : maxWidth}
    style:--bx--card--title-line-clamp={isTitleMulti
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
      class:bx--card__description--truncate-multi={isDescriptionMulti}
      style:--bx--card--description-line-clamp={isDescriptionMulti
        ? descriptionTruncate
        : undefined}
    >
      <slot name="description" />
    </div>
  {/if}
</div>
