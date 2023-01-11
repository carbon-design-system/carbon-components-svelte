<script>
  /**
   * @event {{ toggled: boolean; }} toggle
   */

  /**
   * Specify the toggle size
   * @type {"default" | "sm"}
   */
  export let size = "default";

  /** Set to `true` to toggle the checkbox input */
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
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the checkbox input
   * @type {string}
   */
  export let name = undefined;

  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  $: dispatch("toggle", { toggled });
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class:bx--form-item="{true}"
  {...$$restProps}
  style="{$$restProps['style']}; user-select: none"
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <!-- svelte-ignore a11y-role-has-required-aria-props -->
  <input
    role="switch"
    type="checkbox"
    class:bx--toggle-input="{true}"
    class:bx--toggle-input--small="{size === 'sm'}"
    checked="{toggled}"
    on:change="{() => {
      toggled = !toggled;
    }}"
    on:change
    on:keyup="{(e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggled = !toggled;
      }
    }}"
    on:keyup
    on:focus
    on:blur
    disabled="{disabled}"
    id="{id}"
    name="{name}"
  />
  <label
    aria-label="{labelText ? undefined : $$props['aria-label'] || 'Toggle'}"
    for="{id}"
    class:bx--toggle-input__label="{true}"
  >
    <span class:bx--visually-hidden="{hideLabel}">
      <slot name="labelText">
        {labelText}
      </slot>
    </span>
    <span
      class:bx--toggle__switch="{true}"
      style="{hideLabel && 'margin-top: 0'}"
    >
      <span aria-hidden="true" class:bx--toggle__text--off="{true}">
        <slot name="labelA">
          {labelA}
        </slot>
      </span>
      <span aria-hidden="true" class:bx--toggle__text--on="{true}">
        <slot name="labelB">
          {labelB}
        </slot>
      </span>
    </span>
  </label>
</div>
