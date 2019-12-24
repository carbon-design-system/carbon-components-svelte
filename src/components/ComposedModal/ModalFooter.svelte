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

  import { createEventDispatcher, getContext } from 'svelte';
  import { cx } from '../../lib';
  import Button from '../Button';

  const dispatch = createEventDispatcher();
  const { closeModal, submit } = getContext('ComposedModal');
  const _footerClass = cx('--modal-footer', className);
</script>

<div class={_footerClass} {style}>
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
