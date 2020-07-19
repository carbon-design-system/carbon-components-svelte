<script>
  export let open = false;
  export let danger = false;
  export let size = undefined; // "xs" | "sm" | "lg"
  export let containerClass = "";
  export let selectorPrimaryFocus = "[data-modal-primary-focus]";
  export let ref = null;

  import {
    createEventDispatcher,
    tick,
    setContext,
    onMount,
    afterUpdate
  } from "svelte";

  const dispatch = createEventDispatcher();

  let buttonRef = null;
  let innerModal = null;

  setContext("ComposedModal", {
    closeModal: () => {
      open = false;
    },
    submit: () => {
      dispatch("submit");
    },
    declareRef: ref => {
      buttonRef = ref;
    }
  });

  function focus(element) {
    const node =
      (element || innerModal).querySelector(selectorPrimaryFocus) || buttonRef;
    node.focus();
  }

  $: opened = false;
  $: didOpen = open;

  onMount(async () => {
    await tick();
    focus();

    return () => {
      document.body.classList.remove("bx--body--with-modal-open");
    };
  });

  afterUpdate(() => {
    if (opened) {
      if (!open) {
        opened = false;
        dispatch("close");
        document.body.classList.add("bx--body--with-modal-open");
      }
    } else if (open) {
      opened = true;
      dispatch("open");
      document.body.classList.remove("bx--body--with-modal-open");
    }
  });
</script>

<div
  bind:this={ref}
  role="presentation"
  tabindex="-1"
  class:bx--modal={true}
  class:is-visible={open}
  class:bx--modal--danger={danger}
  {...$$restProps}
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
  }}>
  <div
    bind:this={innerModal}
    class:bx--modal-container={true}
    class="{size && `bx--modal-container--${size}`}
    {containerClass}">
    <slot />
  </div>
</div>
