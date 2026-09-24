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

  import WarningFilled from "../icons/WarningFilled.svelte";
  import { uniqueId } from "../utils/unique-id.js";

  const messageId = `form-group-message-${uniqueId()}`;
</script>

<fieldset
  {disabled}
  data-invalid={invalid || undefined}
  class:bx--fieldset={true}
  class:bx--fieldset--no-margin={noMargin}
  aria-labelledby={$$restProps["aria-labelledby"] ?? legendId}
  aria-describedby={message ? messageId : undefined}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {#if legendText}
    <legend
      class:bx--label={true}
      id={legendId || $$restProps["aria-labelledby"]}
    >
      {legendText}
    </legend>
  {/if}
  <slot />
  {#if message}
    <div
      id={messageId}
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
