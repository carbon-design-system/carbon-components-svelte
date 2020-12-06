<script>
  /** Specify the primary button text */
  export let primaryButtonText = "";

  /**  Set to `true` to disable the primary button */
  export let primaryButtonDisabled = false;

  /**
   * Specify a class for the primary button
   * @type {string}
   */
  export let primaryClass = undefined;

  /** Specify the secondary button text */
  export let secondaryButtonText = "";

  /**
   * Specify a class for the secondary button
   * @type {string}
   */
  export let secondaryClass = undefined;

  /** Set to `true` to use the danger variant */
  export let danger = false;

  import { getContext } from "svelte";
  import Button from "../Button/Button.svelte";

  const { closeModal, submit } = getContext("ComposedModal");
</script>

<div class:bx--modal-footer="{true}" {...$$restProps}>
  {#if secondaryButtonText}
    <Button kind="secondary" class="{secondaryClass}" on:click="{closeModal}">
      {secondaryButtonText}
    </Button>
  {/if}
  {#if primaryButtonText}
    <Button
      kind="{danger ? 'danger' : 'primary'}"
      disabled="{primaryButtonDisabled}"
      class="{primaryClass}"
      on:click="{submit}"
    >
      {primaryButtonText}
    </Button>
  {/if}
  <slot />
</div>
