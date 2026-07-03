<script>
  /**
   * @event {MouseEvent} click
   */

  /**
   * @template [Icon=any]
   */

  /**
   * Specify the kind of item.
   * @type {"default" | "danger"}
   */
  export let kind = "default";

  /** Set to `true` to disable the item */
  export let disabled = false;

  /**
   * Specify the icon to render.
   * Icon is rendered to the left of the label text.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  /**
   * Specify the label text.
   * Required to nest `MenuItem` children and create a submenu: once set,
   * the default slot holds the nested items instead of the label.
   * Alternatively, use the "labelChildren" slot for custom label content;
   * `labelText` is still used as the accessible name and title in that case.
   * @type {string | undefined}
   */
  export let labelText = undefined;

  /**
   * Obtain a reference to the list item HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import CaretRight from "../icons/CaretRight.svelte";
  import Menu from "./Menu.svelte";

  // "moderate-01" duration (ms) from Carbon motion recommended for small
  // expansion, short distance movements - matches the delay used for
  // ContextMenuOption's own submenu hover.
  const HOVER_DELAY_MS = 150;

  const dispatch = createEventDispatcher();
  const ctx = getContext("carbon:Menu");

  let submenuOpen = false;
  let hoverTimeout;
  let closeTimeout;

  $: hasSubmenu = labelText !== undefined && $$slots.default;

  function handleClick(event) {
    if (disabled) return;

    const shouldContinue = dispatch("click", event, { cancelable: true });

    if (shouldContinue) {
      ctx.close("select");
    }
  }

  function openSubmenu() {
    if (disabled) return;
    clearTimeout(hoverTimeout);
    clearTimeout(closeTimeout);
    submenuOpen = true;
  }

  function scheduleOpenSubmenu() {
    if (disabled) return;
    clearTimeout(closeTimeout);
    clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(openSubmenu, HOVER_DELAY_MS);
  }

  function scheduleCloseSubmenu() {
    clearTimeout(hoverTimeout);
    clearTimeout(closeTimeout);
    closeTimeout = setTimeout(() => {
      submenuOpen = false;
    }, HOVER_DELAY_MS);
  }

  function cancelCloseSubmenu() {
    clearTimeout(closeTimeout);
  }

  onMount(() => {
    return () => {
      clearTimeout(hoverTimeout);
      clearTimeout(closeTimeout);
    };
  });
</script>

<li
  bind:this={ref}
  role="menuitem"
  tabindex="-1"
  aria-disabled={disabled}
  aria-haspopup={hasSubmenu ? true : undefined}
  aria-expanded={hasSubmenu ? submenuOpen : undefined}
  class:bx--menu-option={true}
  class:bx--menu-option--disabled={disabled}
  class:bx--menu-option--active={hasSubmenu && submenuOpen}
  class:bx--menu-option--danger={!hasSubmenu && kind === "danger"}
  {...$$restProps}
  on:keydown
  on:keydown={(event) => {
    if (disabled) return;

    if (hasSubmenu) {
      if (
        event.key === "ArrowRight" ||
        event.key === " " ||
        event.key === "Enter"
      ) {
        event.preventDefault();
        openSubmenu();
      }
      return;
    }

    if (event.key === " " || event.key === "Enter") {
      // Space's default action scrolls the page on a non-native focusable
      // element like this <li>; Enter has no such default here, but
      // preventing both keeps the two keys consistent.
      event.preventDefault();
      handleClick(event);
    }
  }}
  on:click={(event) => {
    if (hasSubmenu) {
      event.stopPropagation();
      if (disabled) return;
      openSubmenu();
      return;
    }
    handleClick(event);
  }}
  on:mouseenter={() => {
    if (hasSubmenu) scheduleOpenSubmenu();
  }}
  on:mouseleave={() => {
    if (hasSubmenu) scheduleCloseSubmenu();
  }}
>
  <div
    class:bx--menu-option__content={true}
    class:bx--menu-option__content--disabled={disabled}
  >
    {#if icon}
      <div class:bx--menu-option__icon={true}>
        <svelte:component this={icon} />
      </div>
    {/if}
    <span
      class:bx--menu-option__label={true}
      title={hasSubmenu ? labelText : undefined}
    >
      {#if labelText !== undefined}
        <slot name="labelChildren">{labelText}</slot>
      {:else}
        <slot />
      {/if}
    </span>
    {#if hasSubmenu}
      <div class:bx--menu-option__info={true}>
        <CaretRight />
      </div>
    {/if}
  </div>

  {#if hasSubmenu}
    <Menu
      anchor={ref}
      direction="right"
      intrinsicWidth
      intrinsicAlign="start"
      bind:open={submenuOpen}
      {labelText}
      on:keydown={(event) => {
        if (event.key === "ArrowLeft") {
          event.stopPropagation();
          submenuOpen = false;
          ref?.focus({ preventScroll: true });
        }
      }}
      on:mouseenter={cancelCloseSubmenu}
      on:mouseleave={scheduleCloseSubmenu}
      on:close={(event) => {
        if (event.detail.trigger === "select") ctx.close("select");
      }}
    >
      <slot />
    </Menu>
  {/if}
</li>
