<script>
  /**
   * @template [Icon=any]
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

  /**
   * Set to `true` to open the menu.
   * @bindable writable
   */
  export let open = false;

  /** Set to `true` to enable the light variant */
  export let light = false;

  /** Set to `true` to disable the trigger button */
  export let disabled = false;

  /** Set to `true` to flip the menu relative to the button */
  export let flipped = false;

  /**
   * Specify the menu options class.
   * @type {string}
   */
  export let menuOptionsClass = undefined;

  /**
   * Specify the icon to render.
   * @type {Icon}
   * @bindable writable
   */
  export let icon = /** @type {Icon} */ (OverflowMenuVertical);

  /**
   * Specify the icon class.
   * @type {string}
   */
  export let iconClass = undefined;

  /** Specify the ARIA label for the icon */
  export let iconDescription = "Open and close list of options";

  /** Set an id for the button element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Obtain a reference to the trigger button element.
   * @bindable readonly
   */
  export let buttonRef = null;

  /**
   * Obtain a reference to the overflow menu element.
   * @bindable readonly
   */
  export let menuRef = null;

  /**
   * Set to `true` to render the menu in a portal,
   * allowing it to escape containers with `overflow: hidden`.
   * When inside a Modal, defaults to `true` unless explicitly set to `false`.
   * @type {boolean | undefined}
   */
  export let portalMenu = undefined;

  import {
    afterUpdate,
    createEventDispatcher,
    getContext,
    setContext,
  } from "svelte";
  import { derived, writable } from "svelte/store";
  import OverflowMenuHorizontal from "../icons/OverflowMenuHorizontal.svelte";
  import OverflowMenuVertical from "../icons/OverflowMenuVertical.svelte";
  import FloatingPortal from "../Portal/FloatingPortal.svelte";
  import { dismiss } from "../utils/dismiss.js";
  import { isOutsideClick } from "../utils/isOutsideClick.js";
  import { keyBy } from "../utils/keyBy.js";
  import { rovingFocus } from "../utils/rovingFocus.js";

  const ctxBreadcrumbItem = getContext("carbon:BreadcrumbItem");
  const insideModal = getContext("carbon:Modal");

  $: effectivePortalMenu =
    portalMenu === undefined ? !!insideModal : portalMenu;

  const dispatch = createEventDispatcher();
  /**
   * @type {import("svelte/store").Writable<ReadonlyArray<{ id: string; text: string; primaryFocus: boolean; disabled: boolean; index: number }>>}
   */
  const items = writable([]);
  /**
   * @type {import("svelte/store").Readable<Record<string, { id: string; text: string; primaryFocus: boolean; disabled: boolean; index: number }>>}
   */
  const itemsById = derived(items, (_) => keyBy(_));
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
  function add({ id, text, primaryFocus, disabled }) {
    items.update((_) => {
      if (primaryFocus) {
        currentIndex.set(_.length);
      }

      return [..._, { id, text, primaryFocus, disabled, index: _.length }];
    });
  }

  /** @type {(id: string) => void} */
  function remove(id) {
    items.update((_) => _.filter((item) => item.id !== id));
  }

  /**
   * @type {(id: string, item: { id: string; text: string; primaryFocus: boolean; disabled: boolean; index: number }) => void}
   */
  function update(id, item) {
    currentId.set(id);

    const shouldContinue = dispatch(
      "close",
      { index: item.index, text: item.text },
      { cancelable: true },
    );
    if (shouldContinue) {
      open = false;
    }
  }

  function first() {
    const index = $items.findIndex((_) => !_.disabled);
    if (index >= 0) currentIndex.set(index);
  }

  function last() {
    for (let index = $items.length - 1; index >= 0; index--) {
      if (!$items[index].disabled) {
        currentIndex.set(index);
        return;
      }
    }
  }

  setContext("carbon:OverflowMenu", {
    focusedId,
    items,
    itemsById,
    add,
    remove,
    update,
    first,
    last,
  });

  // Roving focus over the registry (`$items`), not the DOM: the focused item
  // is the one whose id matches `focusedId`, set reactively from `currentIndex`.
  const menuRovingFocus = {
    selector: "[role='menuitem']",
    orientation: /** @type {const} */ ("vertical"),
    skipDisabled: true,
    getItems: () => $items,
    isDisabled: (item) => item.disabled,
    getActiveIndex: () => $currentIndex,
    onMove: (index) => currentIndex.set(index),
  };

  afterUpdate(() => {
    if (open) {
      const width = buttonRef.offsetWidth;
      const height = buttonRef.offsetHeight;

      buttonWidth = width;

      if (!onMountAfterUpdate && $currentIndex < 0) {
        menuRef?.focus();
      }

      if (!effectivePortalMenu) {
        // Menu is a button sibling; position from offsetTop/offsetLeft.
        const { offsetTop, offsetLeft } = buttonRef;

        if (direction === "top") {
          menuRef.style.top = `${offsetTop - menuRef.offsetHeight}px`;
        } else {
          menuRef.style.top = `${offsetTop + height}px`;
        }

        if (flipped) {
          menuRef.style.left = `${offsetLeft + width - menuRef.offsetWidth}px`;
        } else {
          menuRef.style.left = `${offsetLeft}px`;
        }

        if (ctxBreadcrumbItem) {
          menuRef.style.top = `${offsetTop + height + 10}px`;
          menuRef.style.left = `${offsetLeft - 11}px`;
        }
      } else if (flipped && menuRef) {
        menuRef.style.marginLeft = `${width - menuRef.offsetWidth}px`;
      }
    }

    if (!open) {
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

  function handleOutsideClick(event) {
    if (menuRef && isOutsideClick(event, [buttonRef, menuRef])) {
      const shouldContinue = dispatch("close", null, { cancelable: true });
      if (shouldContinue) {
        open = false;
      }
    }
  }
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<button
  bind:this={buttonRef}
  use:dismiss={{ enabled: open, type: "click", handler: handleOutsideClick }}
  type="button"
  {disabled}
  aria-haspopup="menu"
  aria-expanded={open}
  aria-label={ariaLabel}
  aria-controls={menuId}
  {id}
  class:bx--overflow-menu={true}
  class:bx--overflow-menu--open={open}
  class:bx--overflow-menu--light={light}
  class:bx--overflow-menu--sm={size === "sm"}
  class:bx--overflow-menu--xl={size === "xl"}
  {...$$restProps}
  on:click
  on:click={({ target }) => {
    if (!menuRef?.contains(target)) {
      if (open) {
        const shouldContinue = dispatch("close", null, { cancelable: true });
        if (shouldContinue) {
          open = false;
        }
      } else {
        open = true;
      }
    }
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown
  on:keydown={(event) => {
    if (open) {
      if (["ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
      } else if (event.key === "Home") {
        event.preventDefault();
        first();
      } else if (event.key === "End") {
        event.preventDefault();
        last();
      } else if (event.key === "Escape") {
        event.stopPropagation();
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
</button>

{#if open && !effectivePortalMenu}
  <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
  <ul
    bind:this={menuRef}
    use:rovingFocus={menuRovingFocus}
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
    on:keydown={(e) => {
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
    }}
  >
    <slot />
  </ul>
{/if}

{#if effectivePortalMenu}
  <FloatingPortal
    anchor={buttonRef}
    {direction}
    {open}
    let:direction={portalDirection}
  >
    <!-- svelte-ignore a11y-no-noninteractive-element-to-interactive-role -->
    <ul
      bind:this={menuRef}
      use:rovingFocus={menuRovingFocus}
      role="menu"
      tabindex="-1"
      id={menuId}
      aria-label={ariaLabel}
      data-floating-menu-direction={portalDirection}
      class:bx--overflow-menu-options={true}
      class:bx--overflow-menu--flip={flipped}
      class:bx--overflow-menu-options--open={open}
      class:bx--overflow-menu-options--light={light}
      class:bx--overflow-menu-options--sm={size === "sm"}
      class:bx--overflow-menu-options--xl={size === "xl"}
      class:bx--breadcrumb-menu-options={!!ctxBreadcrumbItem}
      class={menuOptionsClass}
      style="position: relative; top: auto; left: auto; --overflow-menu-options-after-width: {overflowMenuOptionsAfterWidth}"
      on:keydown={(event) => {
        if (["ArrowDown", "ArrowLeft", "ArrowRight", "ArrowUp"].includes(event.key)) {
          event.preventDefault();
        } else if (event.key === "Escape") {
          event.stopPropagation();
          const shouldContinue = dispatch("close", null, { cancelable: true });
          if (shouldContinue) {
            open = false;
            buttonRef.focus();
          }
        }
      }}
    >
      <slot />
    </ul>
  </FloatingPortal>
{/if}

<style>
  .bx--overflow-menu-options:after {
    width: var(--overflow-menu-options-after-width, 2rem);
  }
</style>
