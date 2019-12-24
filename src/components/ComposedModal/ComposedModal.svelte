<script>
  let className = undefined;
  export { className as class };
  export let containerClass = undefined;
  export let open = false;
  export let danger = false;
  export let selectorPrimaryFocus = '[data-modal-primary-focus]';
  export let size = undefined;
  export let style = undefined;

  import { createEventDispatcher, setContext, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();
  const refs = {};
  let outerModal = undefined;
  let innerModal = undefined;

  setContext('ComposedModal', {
    closeModal: () => {
      open = false;
    },
    submit: () => {
      dispatch('submit');
    },
    declareRef: ({ name, ref }) => {
      refs[name] = ref;
    }
  });

  onDestroy(() => {
    document.body.classList.remove(cx('--body--with-modal-open'));
  });

  function focus(element) {
    if (element.querySelector(selectorPrimaryFocus)) {
      return focusElement.focus();
    }

    if (refs.buttonRef) {
      refs.buttonRef.focus();
    }
  }

  const _containerClass = cx(
    '--modal-container',
    size && `--modal-container--${size}`,
    containerClass
  );
  $: didOpen = open;
  $: _class = cx('--modal', open && 'is-visible', danger && '--modal--danger', className);
  $: if (innerModal) {
    focus(innerModal);
  }
  $: {
    if (open) {
      document.body.classList.add(cx('--body--with-modal-open'));
    } else {
      dispatch('close');
      document.body.classList.remove(cx('--body--with-modal-open'));
    }
  }
</script>

<div
  role="presentation"
  tabindex="-1"
  bind:this={outerModal}
  class={_class}
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
  on:transitionend={() => {
    if (didOpen) {
      focus(outerModal);
      didOpen = false;
    }
  }}
  {style}>
  <div bind:this={innerModal} class={_containerClass}>
    <slot />
  </div>
</div>
