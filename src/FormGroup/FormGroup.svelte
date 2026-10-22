<script>
  /**
   * @restProps {fieldset}
   * @slot {{}}
   */

  /** Set to `true` for to remove the bottom margin */
  export let noMargin = false;

  /**
   * Set to `true` to indicate an invalid state.
   * With `message`, shows the message as an error with a warning icon.
   */
  export let invalid = false;

  /**
   * Set to `true` to disable the fieldset and nested native form controls.
   * Div-based controls such as Dropdown may still need an explicit
   * `disabled` prop for full visual disable.
   */
  export let disabled = false;

  /** Set to `true` to render a form requirement */
  export let message = false;

  /** Specify the message text */
  export let messageText = "";

  /** Specify the legend text */
  export let legendText = "";

  /** Specify an id for the legend element */
  export let legendId = "";

  /**
   * Set an id for the fieldset element.
   * The message id derives from it as `{id}-message`. `FormHelperText`
   * and `FormRequirement` placed directly in the group derive theirs as
   * `helper-{id}`, `error-{id}`, and `warn-{id}`.
   */
  export let id = uniqueId();

  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import { joinDescribedBy } from "../utils/field-status.js";
  import { createFormParts, partsDescribedBy } from "../utils/form-parts.js";
  import { uniqueId } from "../utils/unique-id.js";

  const sharedId = writable(id);
  const sharedDisabled = writable(disabled);
  const formParts = createFormParts();
  const parts = formParts.parts;
  /**
   * Registers a mounted part's id under its kind.
   * @type {(kind: "label" | "helper" | "invalid" | "warn") => import("../utils/form-parts.js").FormPart}
   */
  const part = formParts.part;

  // Helper text and messages placed directly in the group describe the
  // fieldset. `group` tells FormLabel not to treat the fieldset as its
  // control: a legend names a fieldset, not a label.
  setContext("carbon:FormItem", {
    controlId: sharedId,
    disabled: sharedDisabled,
    part,
    group: true,
  });

  $: sharedId.set(id);
  $: sharedDisabled.set(disabled);
  $: describedBy = joinDescribedBy(
    message ? `${id}-message` : undefined,
    partsDescribedBy($parts),
  );
</script>

<fieldset
  {id}
  {disabled}
  data-invalid={invalid || undefined}
  class:bx--fieldset={true}
  class:bx--fieldset--no-margin={noMargin}
  aria-labelledby={$$restProps["aria-labelledby"] ?? (legendId || undefined)}
  {...$$restProps}
  aria-describedby={joinDescribedBy(
    describedBy,
    $$restProps["aria-describedby"],
  )}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if legendText}
    <legend class:bx--label={true} id={legendId || undefined}>
      {legendText}
    </legend>
  {/if}
  <slot />
  {#if message}
    <div
      id="{id}-message"
      role={invalid ? "alert" : undefined}
      class:bx--form__requirement={true}
      class:bx--form__requirement--invalid={invalid}
    >
      {#if invalid}
        <WarningFilled class="bx--form__requirement-icon" />
      {/if}
      {messageText}
    </div>
  {/if}
</fieldset>
