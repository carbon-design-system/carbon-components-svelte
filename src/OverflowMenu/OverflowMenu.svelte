<script>
  export let open = false;
  export let light = false;
  export let flipped = false;
  export let direction = "bottom"; // "top" | "bottom"
  export let tabindex = "0";
  export let icon = OverflowMenuVertical16;
  export let iconClass = undefined;
  export let iconDescription = "Open and close list of options";

  /**
   * Set an id for the button element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);
  export let menuOptionsClass = undefined;

  import { createEventDispatcher, setContext, afterUpdate } from "svelte";
  import { writable } from "svelte/store";
  import OverflowMenuVertical16 from "carbon-icons-svelte/lib/OverflowMenuVertical16";
  import { formatStyle } from "./formatStyle";

  const dispatch = createEventDispatcher();
  const items = writable([]);
  const currentId = writable(undefined);
  const focusedId = writable(undefined);
  const currentIndex = writable(-1);

  $: buttonRef = undefined;
  $: buttonWidth = undefined;
  $: menuRef = undefined;
  $: didOpen = false;

  setContext("OverflowMenu", {
    focusedId,
    add: ({ id, text, primaryFocus }) => {
      items.update((_) => {
        if (primaryFocus) {
          currentIndex.set(_.length);
        }

        return [..._, { id, text, primaryFocus, index: _.length }];
      });
    },
    update: (id) => {
      currentId.set(id);
    },
    change: (direction) => {
      // TODO: skip disabled
      let index = $currentIndex + direction;

      if (index < 0) {
        index = $items.length - 1;
      } else if (index >= $items.length) {
        index = 0;
      }

      currentIndex.set(index);
    },
  });

  afterUpdate(() => {
    if ($currentId) {
      const { index, text } = $items.filter((_) => _.id === $currentId)[0];
      dispatch("close", { index, text });
      open = false;
    }

    if (open) {
      const { width, height } = buttonRef.getBoundingClientRect();

      buttonWidth = width;

      if ($currentIndex < 0) {
        menuRef.focus();
      }

      if (flipped) {
        menuRef.style.left = "auto";
        menuRef.style.right = 0;
      }

      if (direction === "top") {
        menuRef.style.top = "auto";
        menuRef.style.bottom = height + "px";
      }
    }

    if (didOpen && !open) {
      buttonRef.focus();
      items.set([]);
      currentId.set(undefined);
      currentIndex.set(0);
    }

    if (!didOpen && open) {
      didOpen = true;
    }
  });

  $: ariaLabel = $$props["aria-label"] || "menu";
  $: if ($items[$currentIndex]) {
    focusedId.set($items[$currentIndex].id);
  }
  $: dynamicPseudoWidth = `.bx--overflow-menu-options.bx--overflow-menu-options:after {
      width: ${buttonWidth ? buttonWidth + "px" : "2rem"};
    }`;
  $: styles = formatStyle(dynamicPseudoWidth);
</script>

<svelte:head>
  {@html styles}
</svelte:head>

<svelte:body
  on:click={({ target }) => {
    if (buttonRef && buttonRef.contains(target)) return;
    if (menuRef && !menuRef.contains(target)) {
      open = false;
    }
  }} />

<button
  bind:this={buttonRef}
  aria-haspopup
  aria-expanded={open}
  aria-label={ariaLabel}
  {id}
  {tabindex}
  class:bx--overflow-menu={true}
  class:bx--overflow-menu--open={open}
  class:bx--overflow-menu--light={light}
  {...$$restProps}
  on:click
  on:click={({ target }) => {
    if (!(menuRef && menuRef.contains(target))) {
      open = !open;
    }
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown
  on:keydown={(e) => {
    if (open) {
      if (['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
      } else if (e.key === 'Escape') {
        e.stopPropagation();
        open = false;
      }
    }
  }}>
  <slot name="menu">
    <svelte:component
      this={icon}
      aria-label={iconDescription}
      title={iconDescription}
      class="bx--overflow-menu__icon {iconClass}" />
  </slot>
  {#if open}
    <ul
      bind:this={menuRef}
      role="menu"
      tabindex="-1"
      aria-label={ariaLabel}
      data-floating-menu-direction={direction}
      class:bx--overflow-menu-options={true}
      class:bx--overflow-menu--flip={flipped}
      class:bx--overflow-menu-options--open={open}
      class:bx--overflow-menu-options--light={light}
      class:menuOptionsClass>
      <slot />
    </ul>
  {/if}
</button>
