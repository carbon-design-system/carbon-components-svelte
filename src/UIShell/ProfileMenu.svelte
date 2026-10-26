<script>
  /**
   * @event open
   * @type {object}
   * @property {"toggle"} trigger
   */

  /**
   * @event close
   * @type {object}
   * @property {"outside-click" | "toggle" | "escape-key" | "select"} trigger
   */

  /** @slot {{}} avatar - Trigger avatar. Falls back to a placeholder. */

  /**
   * Set to `true` to open the menu.
   * @bindable writable
   */
  export let isOpen = false;

  /**
   * Specify the accessible label for the trigger button.
   * @type {string}
   */
  export let iconDescription = "Profile";

  /**
   * Obtain a reference to the trigger button HTML element.
   * @bindable readonly
   * @type {null | HTMLButtonElement}
   */
  export let ref = null;

  /**
   * Customize the menu slide transition (for example, `{ duration: 200 }`).
   * By default, the menu does not animate.
   * @type {false | import("svelte/transition").SlideParams}
   */
  export let transition = false;

  /** Set to `true` to prevent the menu from closing when clicking outside */
  export let preventCloseOnClickOutside = false;

  /**
   * Set an id for the trigger button. The menu id derives from it as
   * `{id}-menu`, so the server and the browser render the same id.
   * @type {string | undefined}
   */
  export let id = undefined;

  import { createEventDispatcher, setContext, tick } from "svelte";
  import { get } from "svelte/store";
  import { slide } from "svelte/transition";
  import UserAvatar from "../UserAvatar/UserAvatar.svelte";
  import { PROFILE_MENU_CONTEXT_KEY } from "../constants/context-keys.js";
  import { dismiss } from "../utils/dismiss.js";
  import { createDomNodeRegistry } from "../utils/dom-node-registry.js";
  import { returnFocusOnClose } from "../utils/focus.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { isOutsideClick } from "../utils/is-outside-click.js";
  import { pickEdgeMenuItem } from "../utils/pick-edge-menu-item.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { verticalListFocus } from "../utils/vertical-list-focus.js";

  const dispatch = createEventDispatcher();

  const fallbackId = uniqueId();
  $: menuId = `${id ?? fallbackId}-menu`;

  /** @type {null | HTMLDivElement} */
  let refMenu = null;

  const menuItemRegistry = createDomNodeRegistry();
  /** @type {import("svelte/store").Writable<ReadonlyArray<HTMLElement>>} */
  const menuItems = menuItemRegistry.items;
  /** @type {(node: HTMLElement) => void} */
  const registerMenuItem = menuItemRegistry.register;
  /** @type {(node: HTMLElement) => void} */
  const unregisterMenuItem = menuItemRegistry.unregister;

  setContext(PROFILE_MENU_CONTEXT_KEY, {
    menuItems,
    registerMenuItem,
    unregisterMenuItem,
    select,
  });

  function close(trigger) {
    isOpen = false;
    dispatch("close", { trigger });
  }

  // Called by `ProfileMenuItem` once its click handlers have run.
  /** @type {() => void} */
  function select() {
    if (!isOpen) return;
    close("select");
  }

  function handleOutsideClick(event) {
    if (
      isOpen &&
      !preventCloseOnClickOutside &&
      isOutsideClick(event, [ref, refMenu])
    ) {
      close("outside-click");
    }
  }

  function handleKeydown(event) {
    if (isOpen && event.key === "Escape") {
      // Escape that cancels an IME composition is not a close.
      if (isImeComposition(event)) return;
      close("escape-key");
      ref?.focus();
    }
  }

  async function handleTriggerKeydown(event) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        isOpen = true;
        dispatch("open", { trigger: "toggle" });
      }
      await tick();
      menuItemRegistry.flush();
      pickEdgeMenuItem(event.key, get(menuItems))?.focus();
    }
  }

  // Closing unmounts the panel, so focus inside it (e.g. on an item whose
  // handler set `isOpen` to false) would fall to <body>.
  const syncFocusReturn = returnFocusOnClose(
    () => ref,
    () => refMenu,
  );
  $: syncFocusReturn(isOpen);
</script>

<button
  bind:this={ref}
  use:dismiss={{
    enabled: isOpen,
    listeners: [
      { type: "click", handler: handleOutsideClick },
      { type: "keydown", handler: handleKeydown },
    ],
  }}
  type="button"
  aria-expanded={isOpen ? "true" : "false"}
  aria-controls={isOpen ? menuId : undefined}
  aria-label={iconDescription}
  {id}
  class:bx--header__action={true}
  class:bx--header__action--active={isOpen}
  class:bx--profile-menu__trigger={true}
  {...$$restProps}
  on:click
  on:click={async (event) => {
    const wasOpen = isOpen;
    isOpen = !isOpen;
    dispatch(isOpen ? "open" : "close", { trigger: "toggle" });
    if (!wasOpen && isOpen && event.detail === 0) {
      await tick();
      menuItemRegistry.flush();
      get(menuItems)[0]?.focus();
    }
  }}
  on:keydown={handleTriggerKeydown}
>
  <span class:bx--profile-menu__avatar={true}>
    <slot name="avatar"><UserAvatar size="md" /></slot>
  </span>
</button>
{#if isOpen}
  <div
    bind:this={refMenu}
    use:verticalListFocus={{ selector: ".bx--profile-menu__item" }}
    id={menuId}
    aria-label={iconDescription}
    class:bx--profile-menu={true}
    transition:slide|local={{
      ...transition,
      duration: transition === false ? 0 : transition.duration,
    }}
  >
    <slot />
  </div>
{/if}
