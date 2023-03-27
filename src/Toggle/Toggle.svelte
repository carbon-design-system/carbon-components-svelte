<script>
  /**
   * @event {{ toggled: boolean; }} toggle
   */

  /**
   * Specify the toggle size
   * @type {"md" | "sm"}
   */
  export let size = "md";

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
  $: sideLabel = toggled ? labelB : labelA;
  $: isSm = size === "sm";
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--toggle="{true}"
  class:bx--toggle--disabled="{disabled}"
  style:user-select="none"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <!-- svelte-ignore a11y-role-has-required-aria-props -->
  <input
    role="switch"
    type="checkbox"
    class:bx--toggle__button="{true}"
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
    class:bx--toggle__label="{true}"
  >
    <span
      class:bx--toggle__label-text="{true}"
      class:bx--visually-hidden="{hideLabel}"
    >
      <slot name="labelText">
        {labelText}
      </slot>
    </span>
    <div
      class:bx--toggle__appearance="{true}"
      class:bx--toggle__appearance--sm="{isSm}"
      style:margin-top="{hideLabel ? 0 : undefined}"
    >
      <div
        aria-hidden="true"
        class:bx--toggle__switch="{true}"
        class:bx--toggle__switch--checked="{toggled}"
      >
        {#if isSm}
          <svg
            class:bx--toggle__check="{true}"
            width="6px"
            height="5px"
            viewBox="0 0 6 5"
          >
            <path d="M2.2 2.7L5 0 6 1 2.2 5 0 2.7 1 1.5z"></path>
          </svg>
        {/if}
      </div>
      <span class:bx--toggle__text="{true}" aria-hidden="{true}"
        >{sideLabel}</span
      >
    </div>
  </label>
</div>
