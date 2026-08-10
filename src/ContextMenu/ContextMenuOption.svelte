<script>
  /**
   * Dispatched on selection. Cancelable: call `preventDefault()` to keep
   * this menu level open. A selectable or radio option's selection still
   * updates.
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
   * Rendered indented regardless when `icon` is set, or when the option is selectable or part of a radio group.
   */
  export let indented = false;

  /**
   * Specify the icon to render.
   * Icon is rendered to the left of the label text.
   * Overridden with a checkmark icon when the option is selectable or part of a radio group.
   * @type {Icon}
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
  export let id = uniqueId();

  /**
   * Obtain a reference to the list item HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import CaretRight from "../icons/CaretRight.svelte";
  import Checkmark from "../icons/Checkmark.svelte";
  import { clampIndex } from "../utils/clampIndex.js";
  import { uniqueId } from "../utils/uniqueId.js";
  import ContextMenu from "./ContextMenu.svelte";

  const dispatch = createEventDispatcher();
  const ctx = getContext("carbon:ContextMenu");
  const ctxGroup = getContext("carbon:ContextMenuGroup");
  const ctxRadioGroup = getContext("carbon:ContextMenuRadioGroup");

  // "moderate-01" duration (ms) from Carbon motion recommended for small expansion, short distance movements
  const moderate01 = 150;
  const closeDelay = moderate01;

  let unsubCurrentIds = undefined;
  let unsubCurrentId = undefined;
  let timeoutHover = undefined;
  let timeoutClose = undefined;
  let rootMenuPosition = [0, 0];
  let focusIndex = 0;
  let options = [];
  let role = "menuitem";
  let submenuOpen = false;
  let submenuPosition = [0, 0];
  let menuOffsetX = 0;
  /** @type {HTMLUListElement | null} */
  let submenuRef = null;

  const unsubPosition = ctx.position.subscribe((position) => {
    rootMenuPosition = position;
  });

  const unsubMenuOffsetX = ctx.menuOffsetX.subscribe((_menuOffsetX) => {
    menuOffsetX = _menuOffsetX;
  });

  function handleClick(event, opts = {}) {
    if (disabled) return;
    if (subOptions) return;

    // Selection runs first so preventDefault only skips the close.
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

    const shouldClose = dispatch("click", event, { cancelable: true });

    if (shouldClose) {
      ctx.close("select");
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
      unsubPosition();
      unsubMenuOffsetX();
      if (unsubCurrentIds) unsubCurrentIds();
      if (unsubCurrentId) unsubCurrentId();
      if (typeof timeoutHover === "number") clearTimeout(timeoutHover);
      if (typeof timeoutClose === "number") clearTimeout(timeoutClose);
    };
  });

  $: isSelectable = !!ctxGroup || selectable;
  $: isRadio = !!ctxRadioGroup;
  $: subOptions = $$slots.default;
  $: ctx.setPopup(submenuOpen);
  $: if (submenuOpen) {
    const { width, y } = ref.getBoundingClientRect();
    let x = rootMenuPosition[0] + width;

    const submenuWidth = submenuRef?.getBoundingClientRect().width ?? width;

    if (x + submenuWidth > window.innerWidth) {
      x = rootMenuPosition[0] - submenuWidth;

      // On narrow screens, position submenu at edge to avoid clipping.
      if (x < 0) {
        x = Math.max(0, window.innerWidth - submenuWidth);
      }
    }

    submenuPosition = [x, y];
  }
  $: resolvedIcon =
    isSelectable || isRadio ? (selected ? Checkmark : undefined) : icon;
  $: isIndented = indented || icon !== undefined || isSelectable || isRadio;

  $: {
    let nextRole = "menuitem";
    if (isSelectable) nextRole = "menuitemcheckbox";
    if (isRadio) nextRole = "menuitemradio";
    role = nextRole;

    if (isSelectable && selected && ctxGroup) {
      ctxGroup.addOption({ id });
    }

    if (isRadio) {
      ctxRadioGroup.addOption({ id });

      if (selected && ctxRadioGroup) {
        ctxRadioGroup.setOption({ id });
      }
    }
  }
</script>

<li
  bind:this={ref}
  {role}
  tabindex="-1"
  aria-disabled={disabled}
  aria-haspopup={subOptions ? true : undefined}
  aria-expanded={subOptions ? submenuOpen : undefined}
  class:bx--menu-option={true}
  class:bx--menu-option--disabled={disabled}
  class:bx--menu-option--active={subOptions && submenuOpen}
  class:bx--menu-option--danger={!subOptions && kind === "danger"}
  indented={isIndented}
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
      submenuOpen = true;
      await tick();
      options = [...ref.querySelectorAll("li[tabindex]")];
      if (options[focusIndex]) options[focusIndex].focus();
      return;
    }

    if (submenuOpen) {
      if (event.key === "ArrowLeft") {
        event.stopPropagation();
        submenuOpen = false;
        focusIndex = 0;
        ref?.focus({ preventScroll: true });
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
    if (subOptions && !disabled) {
      if (typeof timeoutClose === "number") {
        clearTimeout(timeoutClose);
        timeoutClose = undefined;
      }

      timeoutHover = setTimeout(() => {
        submenuOpen = true;
      }, moderate01);
    }
  }}
  on:mouseleave
  on:mouseleave={() => {
    if (subOptions) {
      if (typeof timeoutHover === "number") clearTimeout(timeoutHover);

      timeoutClose = setTimeout(() => {
        submenuOpen = false;
      }, closeDelay);
    }
  }}
  on:click={(event) => {
    if (subOptions) {
      event.stopPropagation();
      if (disabled) return;
      submenuOpen = true;
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
      {#if isIndented}
        <div class:bx--menu-option__icon={true}>
          <slot name="icon"> <svelte:component this={resolvedIcon} /> </slot>
        </div>
      {/if}
      <span class:bx--menu-option__label={true} title={labelText}>
        <slot name="labelChildren">{labelText}</slot>
      </span>
      <div class:bx--menu-option__info={true}><CaretRight /></div>
    </div>

    <ContextMenu
      bind:ref={submenuRef}
      open={submenuOpen}
      x={submenuPosition[0]}
      y={submenuPosition[1]}
    >
      <slot />
    </ContextMenu>
  {:else}
    <div
      class:bx--menu-option__content={true}
      class:bx--menu-option__content--disabled={disabled}
    >
      {#if isIndented}
        <div class:bx--menu-option__icon={true}>
          <slot name="icon"> <svelte:component this={resolvedIcon} /> </slot>
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
