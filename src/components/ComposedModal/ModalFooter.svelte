<script>
  let className = undefined;
  export { className as class };
  export let primaryClass = undefined;
  export let primaryButtonText = '';
  export let primaryButtonDisabled = false;
  export let secondaryClass = undefined;
  export let secondaryButtonText = '';
  export let danger = false;
  export let style = undefined;

  import { getContext } from 'svelte';
  import { cx } from '../../lib';
  import Button from '../Button';

  const { closeModal, submit } = getContext('ComposedModal');
</script>

<div class={cx('--modal-footer', className)} {style}>
  {#if secondaryButtonText}
    <Button kind="secondary" class={secondaryClass} on:click={closeModal}>
      {secondaryButtonText}
    </Button>
  {/if}
  {#if primaryButtonText}
    <Button
      class={primaryClass}
      kind={danger ? 'danger' : 'primary'}
      disabled={primaryButtonDisabled}
      on:click={submit}>
      {primaryButtonText}
    </Button>
  {/if}
  <slot />
</div>
