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
   * Alternatively, use the "icon" slot for custom icon markup.
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
   * Set to `true` to render the item as a checkbox (`role="menuitemcheckbox"`).
   * Selecting the item toggles `selected` and keeps the menu open.
   * @bindable writable
   */
  export let selectable = false;

  /**
   * Set to `true` to mark a `selectable` item (or a radio item inside a
   * `MenuItemRadioGroup`) as selected.
   * @bindable writable
   */
  export let selected = false;

  /**
   * Set to `true` to reserve the icon gutter even without an icon.
   * Automatically set to `true` when `icon` is provided, or when the item
   * is `selectable` or part of a `MenuItemRadioGroup`.
   * @bindable writable
   */
  export let indented = false;

  /**
   * Specify the shortcut text, rendered at the trailing edge of the item.
   * Alternatively, use the "shortcutText" slot.
   * Ignored for an item with a submenu.
   * @type {string | undefined}
   */
  export let shortcutText = undefined;

  /**
   * Specify the id.
   * It's recommended to provide an id as a value to bind to within a
   * `MenuItemRadioGroup`.
   */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Obtain a reference to the list item HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, getContext, onMount } from "svelte";
  import CaretRight from "../icons/CaretRight.svelte";
  import Checkmark from "../icons/Checkmark.svelte";
  import { createSubmenuHoverController } from "../utils/submenuHoverController.js";
  import { dismiss } from "../utils/dismiss.js";
  import Menu from "./Menu.svelte";

  const dispatch = createEventDispatcher();
  const ctx = getContext("carbon:Menu");
  const ctxRadioGroup = getContext("carbon:MenuRadioGroup");

  let submenuOpen = false;
  let submenuRef = null;
  let unsubCurrentId;
  let role = "menuitem";

  const hover = createSubmenuHoverController({
    isDisabled: () => disabled,
    setOpen: (open) => {
      submenuOpen = open;
    },
    getTrigger: () => ref,
    getSubmenu: () => submenuRef,
  });

  $: hasSubmenu = labelText !== undefined && $$slots.default;
  $: isRadio = !!ctxRadioGroup;

  $: {
    if (icon || $$slots.icon) indented = true;
    if (selectable || isRadio) indented = true;

    let nextRole = "menuitem";
    if (selectable) nextRole = "menuitemcheckbox";
    if (isRadio) nextRole = "menuitemradio";
    role = nextRole;

    if (selectable) icon = selected ? Checkmark : undefined;
    if (isRadio) icon = selected ? Checkmark : undefined;
  }

  function handleClick(event) {
    if (disabled) return;

    const shouldContinue = dispatch("click", event, { cancelable: true });
    if (!shouldContinue) return;

    if (isRadio) {
      ctxRadioGroup.setOption({ id });
      ctx.close("select");
    } else if (selectable) {
      selected = !selected;
    } else {
      ctx.close("select");
    }
  }

  function handleGlobalMouseMove(event) {
    if (!hasSubmenu || !submenuOpen) return;
    hover.trackPointer(event.clientX, event.clientY);
  }

  onMount(() => {
    if (ctxRadioGroup) {
      unsubCurrentId = ctxRadioGroup.currentId.subscribe((currentId) => {
        selected = id === currentId;
      });
      ctxRadioGroup.addOption({ id });
    }

    return () => {
      unsubCurrentId?.();
      hover.destroy();
    };
  });
</script>

<li
  bind:this={ref}
  {role}
  tabindex="-1"
  aria-disabled={disabled}
  aria-haspopup={hasSubmenu ? true : undefined}
  aria-expanded={hasSubmenu ? submenuOpen : undefined}
  aria-checked={selectable || isRadio ? selected : undefined}
  class:bx--menu-option={true}
  class:bx--menu-option--disabled={disabled}
  class:bx--menu-option--active={hasSubmenu && submenuOpen}
  class:bx--menu-option--danger={!hasSubmenu && kind === "danger"}
  {indented}
  {...$$restProps}
  use:dismiss={{
    enabled: hasSubmenu && submenuOpen,
    type: "mousemove",
    handler: handleGlobalMouseMove,
    options: { passive: true },
  }}
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
        hover.open();
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
      hover.open();
      return;
    }
    handleClick(event);
  }}
  on:mouseenter={() => {
    if (hasSubmenu) hover.scheduleOpen();
  }}
  on:mousemove={(event) => {
    if (hasSubmenu && submenuOpen) {
      hover.trackPointer(event.clientX, event.clientY);
    }
  }}
  on:mouseleave={() => {
    if (hasSubmenu) hover.scheduleClose();
  }}
>
  <div
    class:bx--menu-option__content={true}
    class:bx--menu-option__content--disabled={disabled}
  >
    {#if indented}
      <div class:bx--menu-option__icon={true}>
        <slot name="icon">
          {#if icon}<svelte:component this={icon} />{/if}
        </slot>
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
    {:else if shortcutText !== undefined || $$slots.shortcutText}
      <div class:bx--menu-option__info={true}>
        <slot name="shortcutText">{shortcutText}</slot>
      </div>
    {/if}
  </div>

  {#if hasSubmenu}
    <Menu
      bind:ref={submenuRef}
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
      on:mouseenter={hover.cancelClose}
      on:mouseleave={hover.scheduleClose}
      on:close={(event) => {
        if (event.detail.trigger === "select") ctx.close("select");
      }}
    >
      <slot />
    </Menu>
  {/if}
</li>
