<script>
  /**
   * @event {{ toggled: boolean; }} toggle
   */

  /**
   * Specify the toggle size.
   * @type {"default" | "sm"}
   */
  export let size = "default";

  /**
   * Set to `true` to toggle the checkbox input.
   * @bindable writable
   */
  export let toggled = false;

  /** Set to `true` to disable checkbox input */
  export let disabled = false;

  /** Specify the label for the untoggled state */
  export let labelA = "Off";

  /** Specify the label for the toggled state */
  export let labelB = "On";

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Set an id for the input element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

  /**
   * Specify a name attribute for the checkbox input.
   * @type {string}
   */
  export let name = undefined;

  /**
   * Obtain a reference to the input HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--form-item={true}
  class:bx--toggle--readonly={readonly}
  style:user-select="none"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <!-- svelte-ignore a11y-role-has-required-aria-props -->
  <input
    bind:this={ref}
    role="switch"
    type="checkbox"
    class:bx--toggle-input={true}
    class:bx--toggle-input--small={size === "sm"}
    checked={toggled}
    aria-disabled={readonly || undefined}
    aria-readonly={readonly || undefined}
    on:click={(event) => {
      if (readonly) event.preventDefault();
    }}
    on:change={() => {
      if (readonly) return;
      toggled = !toggled;
      dispatch("toggle", { toggled });
    }}
    on:change
    on:keydown={(event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        if (!readonly) ref?.click();
      }
    }}
    on:keyup
    on:focus
    on:blur
    {disabled}
    {id}
    {name}
  >
  <label
    aria-label={labelText ? undefined : $$props["aria-label"] ?? "Toggle"}
    for={id}
    class:bx--toggle-input__label={true}
  >
    {#if labelText || $$slots.labelChildren}
      <span class:bx--visually-hidden={hideLabel}>
        <slot name="labelChildren"> {labelText} </slot>
      </span>
    {/if}
    <span
      class:bx--toggle__switch={true}
      style:margin-top={hideLabel ? 0 : undefined}
    >
      <span aria-hidden="true" class:bx--toggle__text--off={true}>
        <slot name="labelA"> {labelA} </slot>
      </span>
      <span aria-hidden="true" class:bx--toggle__text--on={true}>
        <slot name="labelB"> {labelB} </slot>
      </span>
    </span>
  </label>
</div>
