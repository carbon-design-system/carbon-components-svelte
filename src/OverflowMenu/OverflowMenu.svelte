<script>
  /**
   * @event close
   * @property {number} [index]
   * @property {string} [text]
   */

  /**
   * Specify the size of the overflow menu.
   * @type {"sm" | "xl"}
   */
  export let size = undefined;

  /**
   * Specify the direction of the overflow menu relative to the button.
   * @type {"top" | "bottom"}
   */
  export let direction = "bottom";

  /** Set to `true` to open the menu */
  export let open = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to flip the menu relative to the button */
  export let flipped = false;

  /**
   * Specify the menu options class.
   * @type {string}
   */
  export let menuOptionsClass = undefined;

  /**
   * Specify the icon to render.
   * @type {any}
   */
  export let icon = OverflowMenuVertical;

  /**
   * Specify the icon class.
   * @type {string}
   */
  export let iconClass = undefined;

  /** Specify the ARIA label for the icon */
  export let iconDescription = "Open and close list of options";

  /** Set an id for the button element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /** Obtain a reference to the trigger button element */
  export let buttonRef = null;

  /** Obtain a reference to the overflow menu element */
  export let menuRef = null;

  import {
    afterUpdate,
    createEventDispatcher,
    getContext,
    setContext,
  } from "svelte";
  import { writable } from "svelte/store";
  import OverflowMenuHorizontal from "../icons/OverflowMenuHorizontal.svelte";
  import OverflowMenuVertical from "../icons/OverflowMenuVertical.svelte";

  const ctxBreadcrumbItem = getContext("BreadcrumbItem");
  const dispatch = createEventDispatcher();
  /**
   * @type {import("svelte/store").Writable<ReadonlyArray<{ id: string; text: string; primaryFocus: boolean; disabled: boolean; index: number }>>}
   */
  const items = writable([]);
  const currentId = writable(undefined);
  /**
   * @type {import("svelte/store").Writable<string | undefined>}
   */
  const focusedId = writable(undefined);
  const currentIndex = writable(-1);

  let buttonWidth = undefined;
  let onMountAfterUpdate = true;

  $: if (ctxBreadcrumbItem) {
    icon = OverflowMenuHorizontal;
  }

  /**
   * @type {(data: { id: string; text: string; primaryFocus: boolean; disabled: boolean }) => void}
   */
  const add = ({ id, text, primaryFocus, disabled }) => {
    items.update((_) => {
      if (primaryFocus) {
        currentIndex.set(_.length);
      }

      return [..._, { id, text, primaryFocus, disabled, index: _.length }];
    });
  };

  /**
   * @type {(id: string, item: { id: string; text: string; primaryFocus: boolean; disabled: boolean; index: number }) => void}
   */
  const update = (id, item) => {
    currentId.set(id);

    const shouldContinue = dispatch(
      "close",
      { index: item.index, text: item.text },
      { cancelable: true },
    );
    if (shouldContinue) {
      open = false;
    }
  };

  /**
   * @type {(direction: number) => void}
   */
  const change = (direction) => {
    let index = $currentIndex + direction;

    if (index < 0) {
      index = $items.length - 1;
    } else if (index >= $items.length) {
      index = 0;
    }

    let disabled = $items[index].disabled;

    while (disabled) {
      index = index + direction;

      if (index < 0) {
        index = $items.length - 1;
      } else if (index >= $items.length) {
        index = 0;
      }

      disabled = $items[index].disabled;
    }

    currentIndex.set(index);
  };

  setContext("OverflowMenu", {
    focusedId,
    items,
    add,
    update,
    change,
  });

  afterUpdate(() => {
    if (open) {
      const width = buttonRef.offsetWidth;
      const height = buttonRef.offsetHeight;

      buttonWidth = width;

      if (!onMountAfterUpdate && $currentIndex < 0) {
        menuRef.focus();
      }

      if (flipped) {
        menuRef.style.left = "auto";
        menuRef.style.right = 0;
      }

      if (direction === "top") {
        menuRef.style.top = "auto";
        menuRef.style.bottom = `${height}px`;
      } else if (direction === "bottom") {
        menuRef.style.top = `${height}px`;
      }

      if (ctxBreadcrumbItem) {
        menuRef.style.top = `${height + 10}px`;
        menuRef.style.left = `${-11}px`;
      }
    }

    if (!open) {
      items.set([]);
      currentId.set(undefined);
      currentIndex.set(0);
    }

    onMountAfterUpdate = false;
  });

  $: menuId = `menu-${id}`;
  $: ariaLabel = $$props["aria-label"] ?? "menu";
  $: if ($items[$currentIndex]) {
    focusedId.set($items[$currentIndex].id);
  }
  // Use CSS custom properties instead of dynamic style injection for better
  // performance. The previous approach created individual `style` tags per
  // instance, causing overhead when many OverflowMenu components are rendered.
  $: overflowMenuOptionsAfterWidth = buttonWidth ? `${buttonWidth}px` : "2rem";
</script>

<svelte:window
  on:click={({ target }) => {
    if (buttonRef && buttonRef.contains(target)) return;
    if (menuRef && !menuRef.contains(target)) {
      const shouldContinue = dispatch("close", null, { cancelable: true });
      if (shouldContinue) {
        open = false;
      }
    }
  }}
/>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<button
  bind:this={buttonRef}
  type="button"
  aria-haspopup="true"
  aria-expanded={open}
  aria-label={ariaLabel}
  aria-controls={open ? menuId : undefined}
  {id}
  class:bx--overflow-menu={true}
  class:bx--overflow-menu--open={open}
  class:bx--overflow-menu--light={light}
  class:bx--overflow-menu--sm={size === "sm"}
  class:bx--overflow-menu--xl={size === "xl"}
  {...$$restProps}
  on:click
  on:click={({ target }) => {
    if (!(menuRef && menuRef.contains(target))) {
      open = !open;
      if (!open) {
        const shouldContinue = dispatch("close", null, { cancelable: true });
        if (!shouldContinue) {
          open = true;
        }
      }
    }
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown
  on:keydown={(e) => {
    if (open) {
      if (["ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
      } else if (e.key === "Escape") {
        e.stopPropagation();
        const shouldContinue = dispatch("close", null, { cancelable: true });
        if (shouldContinue) {
          open = false;
          buttonRef.focus();
        }
      }
    }
  }}
>
  <slot name="menu">
    <svelte:component
      this={icon}
      aria-label={iconDescription}
      title={iconDescription}
      class="bx--overflow-menu__icon {iconClass}"
    />
  </slot>
  {#if open}
    <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
    <ul
      bind:this={menuRef}
      role="menu"
      tabindex="-1"
      id={menuId}
      aria-label={ariaLabel}
      data-floating-menu-direction={direction}
      class:bx--overflow-menu-options={true}
      class:bx--overflow-menu--flip={flipped}
      class:bx--overflow-menu-options--open={open}
      class:bx--overflow-menu-options--light={light}
      class:bx--overflow-menu-options--sm={size === "sm"}
      class:bx--overflow-menu-options--xl={size === "xl"}
      class:bx--breadcrumb-menu-options={!!ctxBreadcrumbItem}
      class={menuOptionsClass}
      style="--overflow-menu-options-after-width: {overflowMenuOptionsAfterWidth}"
    >
      <slot />
    </ul>
  {/if}
</button>

<style>
  .bx--overflow-menu-options:after {
    width: var(--overflow-menu-options-after-width, 2rem);
  }
</style>
