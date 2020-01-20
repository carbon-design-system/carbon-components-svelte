<script>
  let className = undefined;
  export { className as class };
  export let containerClass = undefined;
  export let danger = false;
  export let open = false;
  export let selectorPrimaryFocus = '[data-modal-primary-focus]';
  export let size = undefined;
  export let style = undefined;

  import { createEventDispatcher, tick, setContext, onMount, afterUpdate } from 'svelte';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();

  let buttonRef = undefined;
  let outerModal = undefined;
  let innerModal = undefined;

  setContext('ComposedModal', {
    closeModal: () => {
      open = false;
    },
    submit: () => {
      dispatch('submit');
    },
    declareRef: ref => {
      buttonRef = ref;
    }
  });

  // TODO: reuse in Modal
  function focus(element) {
    const node = (element || innerModal).querySelector(selectorPrimaryFocus) || buttonRef;
    node.focus();
  }

  onMount(async () => {
    await tick();
    focus();

    return () => {
      document.body.classList.remove(cx('--body--with-modal-open'));
    };
  });

  afterUpdate(() => {
    if (open) {
      dispatch('open');
      document.body.classList.add(cx('--body--with-modal-open'));
    } else {
      dispatch('close');
      document.body.classList.remove(cx('--body--with-modal-open'));
    }
  });

  $: didOpen = open;
</script>

<div
  bind:this={outerModal}
  role="presentation"
  tabindex="-1"
  class={cx('--modal', open && 'is-visible', danger && '--modal--danger', className)}
  on:click
  on:click={({ target }) => {
    if (!innerModal.contains(target)) {
      open = false;
    }
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:transitionend
  on:transitionend={({ currentTarget }) => {
    if (didOpen) {
      focus(currentTarget);
      didOpen = false;
    }
  }}
  {style}>
  <div
    bind:this={innerModal}
    class={cx('--modal-container', size && `--modal-container--${size}`, containerClass)}>
    <slot />
  </div>
</div>
