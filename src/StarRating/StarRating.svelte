<script>
  /**
   * @restProps {div}
   * @event {number} change
   * @slot {{ value: number }} - Text beside the stars, such as a word for the rating or a review count. `value` previews a hovered star.
   * @slot {{}} legendChildren
   */

  /**
   * Specify the rating, from `0` (not rated) to `max`.
   * A `readonly` rating can be fractional, such as `4.5`.
   * @bindable writable
   */
  export let value = 0;

  /** Specify the number of stars */
  export let max = 5;

  /**
   * Specify the legend text.
   * Alternatively, use the named slot "legendChildren".
   */
  export let legendText = "";

  /** Set to `true` to visually hide the legend */
  export let hideLegend = false;

  /** Specify the helper text */
  export let helperText = "";

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to disable the rating */
  export let disabled = false;

  /**
   * Set to `true` to require a rating.
   * @type {boolean}
   */
  export let required = undefined;

  /**
   * Set to `true` to display the rating as an image instead of an input,
   * such as a product's average. A read-only rating fills partial stars.
   */
  export let readonly = false;

  /**
   * Set to `true` so clicking the current rating clears it.
   */
  export let allowDeselect = false;

  /**
   * Set the size of the stars: 16, 24 or 32 pixels.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /**
   * Specify the text that names a rating, read by screen readers for each
   * star and for a read-only rating.
   * @type {(value: number, max: number) => string}
   */
  export let valueText = (value, max) => `${value} out of ${max} stars`;

  /**
   * Specify a name attribute for the radio inputs, for form submission.
   * @type {string}
   */
  export let name = undefined;

  /** Set an id for the rating's legend and messages */
  export let id = uniqueId();

  import { createEventDispatcher } from "svelte";
  import Star from "../icons/Star.svelte";
  import StarFilled from "../icons/StarFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import {
    buildFieldIds,
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { formReset } from "../utils/form-reset.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();

  /** The star under the pointer, which previews that rating. */
  let hovered = 0;
  /** @type {null | HTMLFieldSetElement} */
  let fieldsetRef = null;

  $: stars = Array.from({ length: max }, (_, index) => index + 1);
  $: shown = hovered || value;
  $: ({ showInvalid } = resolveValidationVisibility({
    invalid,
    warn: false,
    disabled,
    readonly,
  }));
  $: ({ helperId, errorId } = buildFieldIds(id));
  $: legendId = `legend-${id}`;
  // Naming and description go on the radio group, or the read-only image,
  // not on the wrapper that takes the rest props.
  $: ({ ariaLabel, ariaLabelledBy, ariaDescribedBy, rest } =
    splitAriaNaming($$restProps));
  $: describedBy = resolveStatusDescribedBy({
    showInvalid,
    showWarn: false,
    invalidText,
    helperText,
    errorId,
    warnId: "",
    helperId,
  });

  /** @param {number} star */
  function fillOf(star) {
    return Math.min(1, Math.max(0, shown - (star - 1)));
  }

  /** @param {number} next */
  function select(next) {
    if (next === value) return;
    value = next;
    dispatch("change", value);
  }

  function handleFormReset() {
    const checked = fieldsetRef?.querySelector("input:checked");
    select(checked instanceof HTMLInputElement ? Number(checked.value) : 0);
  }
</script>

{#if readonly}
  <div
    class:bx--form-item={true}
    class:bx--star-rating={true}
    class:bx--star-rating--readonly={true}
    class:bx--star-rating--sm={size === "sm"}
    class:bx--star-rating--lg={size === "lg"}
    {...rest}
  >
    {#if legendText || $$slots.legendChildren}
      <span
        id={legendId}
        class:bx--label={true}
        class:bx--visually-hidden={hideLegend}
      >
        <slot name="legendChildren">{legendText}</slot>
      </span>
    {/if}
    <div class:bx--star-rating__row={true}>
      <div
        role="img"
        aria-label={ariaLabel ?? valueText(value, max)}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={joinDescribedBy(
          helperText ? helperId : undefined,
          ariaDescribedBy,
        )}
        class:bx--star-rating__stars={true}
      >
        {#each stars as star (star)}
          <span
            class:bx--star-rating__star={true}
            style:--ccs-star-rating-fill={fillOf(star)}
          >
            <Star class="bx--star-rating__icon" />
            <StarFilled class="bx--star-rating__icon bx--star-rating__fill" />
          </span>
        {/each}
      </div>
      {#if $$slots.default}
        <span class:bx--star-rating__text={true}><slot value={shown} /></span>
      {/if}
    </div>
    {#if helperText}
      <div id={helperId} class:bx--form__helper-text={true}>{helperText}</div>
    {/if}
  </div>
{:else}
  <div
    class:bx--form-item={true}
    class:bx--star-rating={true}
    class:bx--star-rating--sm={size === "sm"}
    class:bx--star-rating--lg={size === "lg"}
    class:bx--star-rating--disabled={disabled}
    {...rest}
  >
    <fieldset
      bind:this={fieldsetRef}
      use:formReset={handleFormReset}
      role="radiogroup"
      class:bx--star-rating__fieldset={true}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={joinDescribedBy(describedBy, ariaDescribedBy)}
      aria-invalid={showInvalid || undefined}
      data-invalid={showInvalid || undefined}
      {disabled}
    >
      {#if legendText || $$slots.legendChildren}
        <legend
          id={legendId}
          class:bx--label={true}
          class:bx--label--disabled={disabled}
          class:bx--visually-hidden={hideLegend}
        >
          <slot name="legendChildren">{legendText}</slot>
        </legend>
      {/if}
      <div class:bx--star-rating__row={true}>
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
          class:bx--star-rating__stars={true}
          on:mouseleave={() => (hovered = 0)}
        >
          {#each stars as star (star)}
            <label
              class:bx--star-rating__star={true}
              class:bx--star-rating__star--on={star <= shown}
              on:mouseenter={() => {
                if (!disabled) hovered = star;
              }}
            >
              <input
                type="radio"
                class:bx--star-rating__input={true}
                name={name ?? `star-rating-${id}`}
                value={star}
                checked={value === star}
                {required}
                {disabled}
                on:click={() => {
                  // A radio fires no change when it is already checked.
                  if (allowDeselect && value === star) select(0);
                }}
                on:change={() => select(star)}
              >
              <span class:bx--visually-hidden={true}
                >{valueText(star, max)}</span
              >
              {#if star <= shown}
                <StarFilled class="bx--star-rating__icon" />
              {:else}
                <Star class="bx--star-rating__icon" />
              {/if}
            </label>
          {/each}
        </div>
        {#if $$slots.default}
          <span class:bx--star-rating__text={true}><slot value={shown} /></span>
        {/if}
      </div>
      {#if showInvalid}
        <div class:bx--star-rating__validation-msg={true}>
          <WarningFilled class="bx--star-rating__invalid-icon" />
          {#if invalidText}
            <div
              id={errorId}
              role="alert"
              class:bx--form-requirement={true}
              class:bx--form-requirement--invalid={true}
            >
              {invalidText}
            </div>
          {/if}
        </div>
      {/if}
    </fieldset>
    {#if helperText && !showInvalid}
      <div
        id={helperId}
        class:bx--form__helper-text={true}
        class:bx--form__helper-text--disabled={disabled}
      >
        {helperText}
      </div>
    {/if}
  </div>
{/if}
