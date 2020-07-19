<script>
  export let primaryClass = undefined;
  export let primaryButtonText = "";
  export let primaryButtonDisabled = false;
  export let secondaryClass = undefined;
  export let secondaryButtonText = "";
  export let danger = false;

  import { getContext } from "svelte";
  import { Button } from "../Button";

  const { closeModal, submit } = getContext("ComposedModal");
</script>

<div class:bx--modal-footer={true} {...$$restProps}>
  {#if secondaryButtonText}
    <Button kind="secondary" class={secondaryClass} on:click={closeModal}>
      {secondaryButtonText}
    </Button>
  {/if}
  {#if primaryButtonText}
    <Button
      kind={danger ? 'danger' : 'primary'}
      disabled={primaryButtonDisabled}
      class={primaryClass}
      on:click={submit}>
      {primaryButtonText}
    </Button>
  {/if}
  <slot />
</div>
