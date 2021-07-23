<script>
  /**
   * @deprecated
   * This component will be removed in version 1.0.0.
   * Use `<Toggle size="sm" />` instead
   */

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

  /** Set an id for the input element */
  export let id = "ccs-" + Math.random().toString(36);

  /**
   * Specify a name attribute for the checkbox input
   * @type {string}
   */
  export let name = undefined;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  class:bx--form-item="{true}"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <input
    type="checkbox"
    checked="{toggled}"
    disabled="{disabled}"
    id="{id}"
    name="{name}"
    class:bx--toggle-input="{true}"
    class:bx--toggle-input--small="{true}"
    on:change
    on:change="{() => {
      toggled = !toggled;
    }}"
    on:keyup
    on:keyup="{(e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggled = !toggled;
      }
    }}"
    on:focus
    on:blur
  />
  <label
    aria-label="{labelText ? undefined : $$props['aria-label'] || 'Toggle'}"
    for="{id}"
    class:bx--toggle-input__label="{true}"
  >
    {labelText}
    <span class:bx--toggle__switch="{true}">
      <svg
        width="6"
        height="5"
        viewBox="0 0 6 5"
        class:bx--toggle__check="{true}"
      >
        <path d="M2.2 2.7L5 0 6 1 2.2 5 0 2.7 1 1.5z"></path>
      </svg>
      <span aria-hidden="true" class:bx--toggle__text--off="{true}">
        {labelA}
      </span>
      <span aria-hidden="true" class:bx--toggle__text--on="{true}"
        >{labelB}</span
      >
    </span>
  </label>
</div>
