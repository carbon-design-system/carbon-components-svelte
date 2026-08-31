<script>
  /**
   * @event open
   * @type {object}
   * @property {"toggle"} trigger
   * @event close
   * @type {object}
   * @property {"outside-click" | "toggle" | "escape-key"} trigger
   * @slot {{}} avatar - Optional leading avatar. Renders nothing by default.
   */

  /**
   * Set to `true` to open the menu.
   * @bindable writable
   */
  export let isOpen = false;

  /**
   * Specify the workspace or account name shown next to the avatar.
   * @type {string}
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
   * Customize the menu slide transition (for example, `{ duration: 200 }`).
   * By default, the menu does not animate.
   * @type {false | import("svelte/transition").SlideParams}
   */
  export let transition = false;

  /** Set to `true` to prevent the menu from closing when clicking outside */
  export let preventCloseOnClickOutside = false;

  import { createEventDispatcher, setContext, tick } from "svelte";
  import { get, writable } from "svelte/store";
  import { slide } from "svelte/transition";
  import ChevronDown from "../icons/ChevronDown.svelte";
  import { dismiss } from "../utils/dismiss.js";
  import { isOutsideClick } from "../utils/isOutsideClick.js";

  const dispatch = createEventDispatcher();

  let refMenu = null;

  /** @type {import("svelte/store").Writable<ReadonlyArray<HTMLElement>>} */
  const menuItems = writable([]);

  function registerMenuItem(element) {
    menuItems.update((items) => [...items, element]);
  }

  function unregisterMenuItem(element) {
    menuItems.update((items) => items.filter((item) => item !== element));
  }

  setContext("carbon:ProfileMenu", {
    menuItems,
    registerMenuItem,
    unregisterMenuItem,
  });

  $: maxWidthStyle = typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth;

  function close(trigger) {
    isOpen = false;
    dispatch("close", { trigger });
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
      const items = get(menuItems);
      if (event.key === "ArrowDown") {
        items[0]?.focus();
      } else {
        items[items.length - 1]?.focus();
      }
    }
  }
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
    aria-haspopup="true"
    aria-expanded={isOpen}
    aria-label={text ? undefined : iconDescription}
    class:bx--header__action={true}
    class:bx--header__action--active={isOpen}
    class:bx--header__action--text={true}
    class:bx--header-switcher__trigger={true}
    {...$$restProps}
    on:click
    on:click|stopPropagation={async (event) => {
      const wasOpen = isOpen;
      isOpen = !isOpen;
      dispatch(isOpen ? "open" : "close", { trigger: "toggle" });
      if (!wasOpen && isOpen && event.detail === 0) {
        await tick();
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
        style:max-width={maxWidthStyle}
        >{text}</span
      >
    {/if}
    <span
      class:bx--header-switcher__chevron={true}
      class:bx--header-switcher__chevron--open={isOpen}
    >
      <ChevronDown size={16} />
    </span>
  </button>
  {#if isOpen}
    <div
      bind:this={refMenu}
      aria-label={iconDescription}
      class:bx--profile-menu={true}
      class:bx--header-switcher__menu={true}
      transition:slide|local={{
        ...transition,
        duration: transition === false ? 0 : transition.duration,
      }}
    >
      <slot />
    </div>
  {/if}
</span>
