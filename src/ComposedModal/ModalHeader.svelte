<script>
  /** Specify the modal title */
  export let title = "";

  /** Specify the modal label */
  export let label = "";

  /** Specify the label class */
  export let labelClass = "";

  /** Specify the title class */
  export let titleClass = "";

  /** Specify the close class */
  export let closeClass = "";

  /** Specify the close icon class */
  export let closeIconClass = "";

  /** Specify the ARIA label for the close icon */
  export let iconDescription = "Close";

  import { getContext } from "svelte";
  import Close from "../icons/Close.svelte";

  const { closeModal, updateLabel } = getContext("ComposedModal");

  $: updateLabel(label);
</script>

<div class:bx--modal-header="{true}" {...$$restProps}>
  {#if label}
    <h2
      class:bx--modal-header__label="{true}"
      class:bx--type-delta="{true}"
      class="{labelClass}"
    >
      {label}
    </h2>
  {/if}
  {#if title}
    <h3
      class:bx--modal-header__heading="{true}"
      class:bx--type-beta="{true}"
      class="{titleClass}"
    >
      {title}
    </h3>
  {/if}
  <slot />
  <button
    type="button"
    aria-label="{iconDescription}"
    class:bx--modal-close="{true}"
    class="{closeClass}"
    on:click
    on:click="{closeModal}"
  >
    <Close
      size="{20}"
      class="bx--modal-close__icon {closeIconClass}"
      aria-hidden="true"
    />
  </button>
</div>
