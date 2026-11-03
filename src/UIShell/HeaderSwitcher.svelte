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

  /**
   * @slot {{}} avatar - Optional leading avatar. Renders nothing by default.
   */

  /**
   * Set to `true` to open the menu.
   * @bindable writable
   */
  export let isOpen = false;

  /**
   * Specify the workspace or account name shown next to the avatar.
   * @type {string | undefined}
   */
  export let text = undefined;

  /**
   * Specify the maximum width of `text` before it truncates with an ellipsis.
   * A number is treated as pixels; a string is used as a CSS length.
   * Set to `"none"` to let the trigger grow with the text.
   * @type {number | string}
   */
  export let maxWidth = "10rem";

  /**
   * Specify the accessible label for the trigger button.
   * Only used when `text` is not set.
   * @type {string}
   */
  export let iconDescription = "Switch account";

  /**
   * Obtain a reference to the trigger button HTML element.
   * @bindable readonly
   * @type {null | HTMLButtonElement}
   */
  export let ref = null;

  /**
   * Animate the menu. Set to `true` for Carbon's slide, to slide params
   * (for example, `{ duration: "slow01" }`) to customize it, or to `{ fn }`
   * to use another transition. By default, the menu does not animate.
   * @type {import("../motion/resolve-transition.js").TransitionProp<import("../motion/transitions.js").SlideParams>}
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
  import { PROFILE_MENU_CONTEXT_KEY } from "../constants/context-keys.js";
  import ChevronDown from "../icons/ChevronDown.svelte";
  import { resolveTransition } from "../motion/resolve-transition.js";
  import { slide } from "../motion/transitions.js";
  import { toCssLength } from "../utils/css-length.js";
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

  const slidePreset = { fn: slide };

  $: ({
    fn: transitionFn,
    params: transitionParams,
    animated,
  } = resolveTransition(transition, slidePreset));

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

  $: maxWidthStyle = toCssLength(maxWidth);

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

<span class:bx--header-switcher={true}>
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
    aria-label={text ? undefined : iconDescription}
    {id}
    class:bx--header__action={true}
    class:bx--header__action--active={isOpen}
    class:bx--header__action--text={true}
    class:bx--header-switcher__trigger={true}
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
    {#if $$slots.avatar}
      <span class:bx--header-switcher__avatar={true}>
        <slot name="avatar" />
      </span>
    {/if}
    {#if text}
      <span
        class:bx--header__action-text={true}
        class:bx--header-switcher__text={true}
        class:bx--header-switcher__text--flush={!$$slots.avatar}
        style:max-width={maxWidthStyle}>{text}</span
      >
    {/if}
    <span
      class:bx--header-switcher__chevron={true}
      class:bx--header-switcher__chevron--open={isOpen}
    >
      <ChevronDown size={16} />
    </span>
  </button>
  {#if isOpen && animated}
    <div
      bind:this={refMenu}
      use:verticalListFocus={{ selector: ".bx--profile-menu__item" }}
      id={menuId}
      aria-label={iconDescription}
      class:bx--profile-menu={true}
      class:bx--header-switcher__menu={true}
      transition:transitionFn|local={transitionParams}
    >
      <slot />
    </div>
  {:else if isOpen}
    <div
      bind:this={refMenu}
      use:verticalListFocus={{ selector: ".bx--profile-menu__item" }}
      id={menuId}
      aria-label={iconDescription}
      class:bx--profile-menu={true}
      class:bx--header-switcher__menu={true}
    >
      <slot />
    </div>
  {/if}
</span>
