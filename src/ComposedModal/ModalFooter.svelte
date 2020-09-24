<script>
  /**
   * Specify the primary button text
   * @type {string} [primaryButtonText=""]
   */
  export let primaryButtonText = "";

  /**
   * Set to `true` to disable the primary button
   * @type {boolean} [primaryButtonDisabled=false]
   */
  export let primaryButtonDisabled = false;

  /**
   * Specify a class for the primary button
   * @type {string} [primaryClass]
   */
  export let primaryClass = undefined;

  /**
   * Specify the secondary button text
   * @type {string} [secondaryButtonText=""]
   */
  export let secondaryButtonText = "";

  /**
   * Specify a class for the secondary button
   * @type {string} [secondaryClass]
   */
  export let secondaryClass = undefined;

  /**
   * Set to `true` to use the danger variant
   * @type {boolean} [danger=false]
   */
  export let danger = false;

  import { getContext } from "svelte";
  import { Button } from "../Button";

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
