<script>
  /**
   * @event {Event} click
   */

  /**
   * @template [Icon=any]
   */

  /**
   * Specify the kind of option.
   * @type {"default" | "danger"}
   */
  export let kind = "default";

  /** Set to `true` to enable the disabled state */
  export let disabled = false;

  /**
   * Set to `true` to indent the label.
   * @bindable writable
   */
  export let indented = false;

  /**
   * Specify the icon to render.
   * Icon is rendered to the left of the label text.
   * @type {Icon}
   * @bindable writable
   */
  export let icon = /** @type {Icon} */ (undefined);

  /**
   * Specify the label text.
   * Alternatively, use the "labelChildren" slot.
   * @example
   * ```svelte
   * <ContextMenuOption>
   *   <span slot="labelChildren">Custom Label</span>
   * </ContextMenuOption>
   * ```
   */
  export let labelText = "";

  /**
   * Set to `true` to use the selected variant.
   * @bindable writable
   */
  export let selected = false;

  /**
   * Set to `true` to enable the selectable variant.
   * Automatically set to `true` if `selected` is `true`.
   * @bindable writable
   */
  export let selectable = false;

  /**
   * Specify the shortcut text.
   * Alternatively, use the "shortcutText" slot.
   * @example
   * ```svelte
   * <ContextMenuOption>
   *   <span slot="shortcutText">Ctrl+K</span>
   * </ContextMenuOption>
   * ```
   */
  export let shortcutText = "";

  /**
   * Specify the id.
   * It's recommended to provide an id as a value to bind to within a selectable/radio menu group.
   */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Obtain a reference to the list item HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import CaretRight from "../icons/CaretRight.svelte";
  import Checkmark from "../icons/Checkmark.svelte";
  import { clampIndex } from "../utils/clampIndex.js";
  import { dismiss } from "../utils/dismiss.js";
  import { createSubmenuHoverController } from "../utils/submenuHoverController.js";
  import ContextMenu from "./ContextMenu.svelte";

  const dispatch = createEventDispatcher();
  const ctx = getContext("carbon:ContextMenu");
  const ctxGroup = getContext("carbon:ContextMenuGroup");
  const ctxRadioGroup = getContext("carbon:ContextMenuRadioGroup");

  let unsubCurrentIds = undefined;
  let unsubCurrentId = undefined;
  let focusIndex = 0;
  let options = [];
  let role = "menuitem";
  let submenuOpen = false;
  /** @type {HTMLUListElement | null} */
  let submenuRef = null;

  const hover = createSubmenuHoverController({
    isDisabled: () => disabled,
    setOpen: (open) => {
      submenuOpen = open;
    },
    getTrigger: () => ref,
    getSubmenu: () => submenuRef,
  });

  function handleClick(event, opts = {}) {
    if (disabled) return;
    if (subOptions) return;

    const shouldContinue = dispatch("click", event, { cancelable: true });

    if (shouldContinue) {
      if (ctxGroup) {
        ctxGroup.toggleOption({ id });
      } else if (ctxRadioGroup) {
        if (opts.fromKeyboard) {
          ctxRadioGroup.setOption({ id: opts.id });
        } else {
          ctxRadioGroup.setOption({ id });
        }
      } else {
        selected = !selected;
      }

      ctx.close("select");
    }
  }

  function handleGlobalMouseMove(event) {
    if (subOptions && submenuOpen) {
      hover.trackPointer(event.clientX, event.clientY);
    }
  }

  onMount(() => {
    if (selected === true) selectable = true;

    if (ctxGroup) {
      unsubCurrentIds = ctxGroup.currentIds.subscribe((_currentIds) => {
        selected = _currentIds.includes(id);
      });
    }

    if (ctxRadioGroup) {
      unsubCurrentId = ctxRadioGroup.currentId.subscribe((_id) => {
        selected = id === _id;
      });
    }

    return () => {
      if (unsubCurrentIds) unsubCurrentIds();
      if (unsubCurrentId) unsubCurrentId();
      hover.destroy();
    };
  });

  $: isSelectable = !!ctxGroup || selectable;
  $: isRadio = !!ctxRadioGroup;
  $: subOptions = $$slots.default;
  $: ctx.setPopup(submenuOpen);
  $: {
    if (icon) {
      indented = true;
    }

    let nextRole = "menuitem";
    if (isSelectable) nextRole = "menuitemcheckbox";
    if (isRadio) nextRole = "menuitemradio";
    role = nextRole;

    if (isSelectable) {
      indented = true;

      if (selected) {
        if (ctxGroup) ctxGroup.addOption({ id });
        icon = Checkmark;
      } else {
        icon = undefined;
      }
    }

    if (isRadio) {
      indented = true;
      ctxRadioGroup.addOption({ id });

      if (selected) {
        if (ctxRadioGroup) ctxRadioGroup.setOption({ id });
        icon = Checkmark;
      } else {
        icon = undefined;
      }
    }
  }
</script>

<li
  bind:this={ref}
  use:dismiss={{
    enabled: !!subOptions && submenuOpen,
    type: "mousemove",
    handler: handleGlobalMouseMove,
    options: { passive: true },
  }}
  {role}
  tabindex="-1"
  aria-disabled={disabled}
  aria-haspopup={subOptions ? true : undefined}
  aria-expanded={subOptions ? submenuOpen : undefined}
  class:bx--menu-option={true}
  class:bx--menu-option--disabled={disabled}
  class:bx--menu-option--active={subOptions && submenuOpen}
  class:bx--menu-option--danger={!subOptions && kind === "danger"}
  {indented}
  aria-checked={isSelectable || isRadio ? selected : undefined}
  data-nested={ref &&
    ref.closest(".bx--menu").getAttribute("data-level") === "2"}
  data-sub={subOptions}
  data-id={id}
  {...$$restProps}
  on:keydown
  on:keydown={async (event) => {
    if (
      subOptions &&
      (event.key === "ArrowRight" || event.key === " " || event.key === "Enter")
    ) {
      if (disabled) return;
      hover.open();
      await tick();
      options = [...ref.querySelectorAll("li[tabindex]")];
      if (options[focusIndex]) options[focusIndex].focus();
      return;
    }

    if (submenuOpen) {
      if (event.key === "ArrowLeft") {
        submenuOpen = false;
        focusIndex = 0;
        return;
      }

      if (event.key === "ArrowDown") {
        focusIndex = clampIndex(focusIndex, 1, options.length);
      } else if (event.key === "ArrowUp") {
        focusIndex = clampIndex(focusIndex, -1, options.length);
      } else if (event.key === "Home") {
        if (options.length > 0) focusIndex = 0;
      } else if (event.key === "End" && options.length > 0) {
        focusIndex = options.length - 1;
      }

      if (options[focusIndex]) options[focusIndex].focus();
    }

    if (event.key === " " || event.key === "Enter") {
      handleClick(event, {
        fromKeyboard: true,
        id: event.target.getAttribute("data-id"),
      });
    }
  }}
  on:mouseenter
  on:mouseenter={() => {
    if (subOptions) hover.scheduleOpen();
  }}
  on:mousemove={(event) => {
    if (subOptions && submenuOpen) {
      hover.trackPointer(event.clientX, event.clientY);
    }
  }}
  on:mouseleave
  on:mouseleave={() => {
    if (subOptions) hover.scheduleClose();
  }}
  on:click={(event) => {
    if (subOptions) {
      event.stopPropagation();
      if (disabled) return;
      hover.open();
      return;
    }
    handleClick(event);
  }}
>
  {#if subOptions}
    <div
      class:bx--menu-option__content={true}
      class:bx--menu-option__content--disabled={disabled}
    >
      {#if indented}
        <div class:bx--menu-option__icon={true}>
          <slot name="icon"> <svelte:component this={icon} /> </slot>
        </div>
      {/if}
      <span class:bx--menu-option__label={true} title={labelText}>
        <slot name="labelChildren">{labelText}</slot>
      </span>
      <div class:bx--menu-option__info={true}><CaretRight /></div>
    </div>

    <ContextMenu
      bind:ref={submenuRef}
      anchor={ref}
      direction="right"
      open={submenuOpen}
      on:mouseenter={hover.cancelClose}
      on:mouseleave={hover.scheduleClose}
    >
      <slot />
    </ContextMenu>
  {:else}
    <div
      class:bx--menu-option__content={true}
      class:bx--menu-option__content--disabled={disabled}
    >
      {#if indented}
        <div class:bx--menu-option__icon={true}>
          <slot name="icon"> <svelte:component this={icon} /> </slot>
        </div>
      {/if}
      <span class:bx--menu-option__label={true} title={labelText}>
        <slot name="labelChildren">{labelText}</slot>
      </span>
      <div class:bx--menu-option__info={true}>
        <slot name="shortcutText">{shortcutText}</slot>
      </div>
    </div>
  {/if}
</li>
