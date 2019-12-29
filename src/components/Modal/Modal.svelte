<script>
  let className = undefined;
  export { className as class };
  export let passiveModal = false;
  export let hasForm = false;
  export let id = Math.random();
  export let modalHeading = undefined;
  export let modalLabel = undefined;
  export let modalAriaLabel = undefined;
  export let open = false;
  export let iconDescription = 'Close the modal';
  export let primaryButtonDisabled = false;
  export let primaryButtonText = '';
  export let secondaryButtonText = '';
  export let danger = false;
  export let shouldSubmitOnEnter = true;
  export let hasScrollingContent = false;
  export let selectorPrimaryFocus = '[data-modal-primary-focus]';
  export let size = undefined;
  export let style = undefined;

  import { createEventDispatcher, afterUpdate, onDestroy } from 'svelte';
  import Close20 from 'carbon-icons-svelte/lib/Close20';
  import { cx } from '../../lib';
  import Button from '../Button';

  const dispatch = createEventDispatcher();

  let buttonRef = undefined;
  let outerModal = undefined;
  let innerModal = undefined;

  // TODO: reuse in ComposedModal
  function focus(element) {
    const node = (element || innerModal).querySelector(selectorPrimaryFocus) || buttonRef;
    node.focus();
  }

  afterUpdate(() => {
    if (open) {
      focus();
      dispatch('open');
      document.body.classList.add(cx('--body--with-modal-open'));
    } else {
      dispatch('close');
      document.body.classList.remove(cx('--body--with-modal-open'));
    }
  });

  onDestroy(() => {
    document.body.classList.remove(cx('--body--with-modal-open'));
  });

  $: modalInstanceId = `modal-${id}`;
  $: modalLabelId = cx(`--modal-header__label--${modalInstanceId}`);
  $: modalHeadingId = cx(`--modal-header__heading--${modalInstanceId}`);
  $: ariaLabel = modalLabel || $$props['aria-label'] || modalAriaLabel || modalHeading;
</script>

<div
  bind:this={outerModal}
  role="presentation"
  tabindex="-1"
  class={cx('--modal', !passiveModal && '--modal-tall', open && 'is-visible', danger && '--modal--danger', className)}
  on:keydown
  on:keydown={({ key }) => {
    if (open) {
      if (key === 'Escape') {
        open = false;
      } else if (shouldSubmitOnEnter && key === 'Enter') {
        dispatch('submit');
      }
    }
  }}
  on:click
  on:click={({ target }) => {
    if (!innerModal.contains(target)) {
      open = false;
    }
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave
  {id}
  {style}>
  <div
    bind:this={innerModal}
    role="dialog"
    aria-modal="true"
    aria-label={ariaLabel}
    class={cx('--modal-container', size && `--modal-container--${size}`)}>
    <div class={cx('--modal-header')}>
      {#if passiveModal}
        <button
          bind:this={buttonRef}
          type="button"
          aria-label={iconDescription}
          title={iconDescription}
          class={cx('--modal-close')}
          on:click={() => {
            open = false;
          }}>
          <Close20 aria-label={iconDescription} class={cx('--modal-close__icon')} />
        </button>
      {/if}
      {#if modalLabel}
        <h2 id={modalLabelId} class={cx('--modal-header__label')}>
          <slot name="label">{modalLabel}</slot>
        </h2>
      {/if}
      <h3 id={modalHeadingId} class={cx('--modal-header__heading')}>
        <slot name="heading">{modalHeading}</slot>
      </h3>
      {#if !passiveModal}
        <button
          bind:this={buttonRef}
          type="button"
          aria-label={iconDescription}
          title={iconDescription}
          class={cx('--modal-close')}
          on:click={() => {
            open = false;
          }}>
          <Close20 aria-label={iconDescription} class={cx('--modal-close__icon')} />
        </button>
      {/if}
    </div>
    <div
      class={cx('--modal-content', hasForm && '--modal-content--with-form', hasScrollingContent && '--modal-scroll-content')}
      tabindex={hasScrollingContent ? '0' : undefined}
      role={hasScrollingContent ? 'region' : undefined}
      aria-label={hasScrollingContent ? ariaLabel : undefined}
      aria-labelledby={modalLabel ? modalLabelId : modalHeadingId}>
      <slot />
    </div>
    {#if hasScrollingContent}
      <div class={cx('--modal-content--overflow-indicator')} />
    {/if}
    {#if !passiveModal}
      <div class={cx('--modal-footer')}>
        <Button
          kind="secondary"
          on:click={() => {
            dispatch('click:button--secondary');
          }}>
          {secondaryButtonText}
        </Button>
        <Button
          kind={danger ? 'danger' : 'primary'}
          disabled={primaryButtonDisabled}
          on:click={() => {
            dispatch('submit');
          }}>
          {primaryButtonText}
        </Button>
      </div>
    {/if}
  </div>
</div>
