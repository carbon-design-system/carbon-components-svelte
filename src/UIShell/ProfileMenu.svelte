<script>
  /**
   * @event {null} open
   * @event {null} close
   * @slot {{}} avatar - Trigger avatar. Falls back to a placeholder.
   */

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
   * Customize the menu transition (for example, `transition:slide`).
   * Set to `false` to disable the transition.
   * @type {false | import("svelte/transition").SlideParams}
   */
  export let transition = { duration: 200 };

  /** Set to `true` to prevent the menu from closing when clicking outside */
  export let preventCloseOnClickOutside = false;

  import { createEventDispatcher } from "svelte";
  import { slide } from "svelte/transition";
  import { dismiss } from "../utils/dismiss.js";
  import { isOutsideClick } from "../utils/isOutsideClick.js";

  const dispatch = createEventDispatcher();

  let refMenu = null;

  function close() {
    isOpen = false;
    dispatch("close");
  }

  function handleOutsideClick(event) {
    if (
      isOpen &&
      !preventCloseOnClickOutside &&
      isOutsideClick(event, [ref, refMenu])
    ) {
      close();
    }
  }

  function handleKeydown(event) {
    if (isOpen && event.key === "Escape") {
      close();
      ref?.focus();
    }
  }
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
  aria-haspopup="menu"
  aria-expanded={isOpen}
  aria-label={iconDescription}
  class:bx--header__action={true}
  class:bx--header__action--active={isOpen}
  class:bx--profile-menu__trigger={true}
  {...$$restProps}
  on:click
  on:click|stopPropagation={() => {
    isOpen = !isOpen;
    dispatch(isOpen ? "open" : "close");
  }}
>
  <span class:bx--profile-menu__avatar={true}>
    <slot name="avatar" />
  </span>
</button>
{#if isOpen}
  <div
    bind:this={refMenu}
    class:bx--profile-menu={true}
    transition:slide|local={{
      ...transition,
      duration: transition === false ? 0 : transition.duration,
    }}
  >
    <slot />
  </div>
{/if}
