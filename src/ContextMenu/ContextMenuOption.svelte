<script>
  /**
   * Dispatched on selection. Cancelable: call `preventDefault()` to keep
   * this menu level open. A selectable or radio option's selection still
   * updates.
   * @event {Event} click
   */

  /**
   * @slot {{}} shortcutChildren - Custom shortcut content. Replaces `shortcutText` and `shortcut`.
   * @deprecated use the `shortcutChildren` slot
   * @slot {{}} shortcutText
   */

  /**
   * @template {import("../utils/icon-component.js").IconComponent} [Icon=any]
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
   * @type {Icon | undefined}
   */
  export let icon = /** @type {Icon | undefined} */ (undefined);

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
   * Alternatively, use the "shortcutChildren" slot.
   * @example
   * ```svelte
   * <ContextMenuOption>
   *   <span slot="shortcutChildren">Ctrl+K</span>
   * </ContextMenuOption>
   * ```
   */
  export let shortcutText = "";

  /**
   * Specify a keyboard shortcut to show, such as `"mod+s"`. `mod` is
   * Command on Apple platforms and Ctrl elsewhere. The keys show where
   * `shortcutText` goes, and the item gets `aria-keyshortcuts`. Display only:
   * bind the command itself with `onShortcut`, since the menu is usually
   * closed. `shortcutText` and its slot take precedence. A value that isn't
   * a shortcut, such as `"⌘C"`, shows as written.
   */
  export let shortcut = "";

  /**
   * Specify the id.
   * It's recommended to provide an id as a value to bind to within a selectable/radio menu group.
   */
  export let id = uniqueId();

  /**
   * Obtain a reference to the list item HTML element.
   * @bindable readonly
   * @type {null | HTMLLIElement}
   */
  export let ref = null;

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import Kbd from "../Kbd/Kbd.svelte";
  import {
    SUBMENU_AIM_PAUSE_MS,
    SUBMENU_HOVER_DELAY_MS,
  } from "../constants/timing.js";
  import CaretRight from "../icons/CaretRight.svelte";
  import Checkmark from "../icons/Checkmark.svelte";
  import { hasModifierKey } from "../utils/has-modifier-key.js";
  import {
    applePlatform,
    ariaKeyShortcuts,
    parseShortcut,
  } from "../utils/keyboard-shortcut.js";
  import {
    getLayoutDirection,
    inlineKey,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { menuOptionLabel } from "../utils/menu-option-label.js";
  import { fitMenuAxis } from "../utils/menu-placement.js";
  import { nextEnabledIndex } from "../utils/move-index.js";
  import { createSubmenuHoverIntent } from "../utils/submenu-hover-intent.js";
  import {
    createTypeaheadBuffer,
    isTypeaheadKey,
    typeaheadIndex,
  } from "../utils/typeahead.js";
  import { uniqueId } from "../utils/unique-id.js";
  import ContextMenu from "./ContextMenu.svelte";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();
  const ctx = getContext("carbon:ContextMenu");
  const ctxGroup = getContext("carbon:ContextMenuGroup");
  const ctxRadioGroup = getContext("carbon:ContextMenuRadioGroup");

  let unsubCurrentIds;
  let unsubCurrentId;
  let rootMenuPosition = [0, 0];
  let focusIndex = 0;
  let options = [];
  let role = "menuitem";
  let submenuOpen = false;
  let submenuPosition = [0, 0];
  /** @type {HTMLUListElement | null} */
  let submenuRef = null;

  const typeahead = createTypeaheadBuffer();

  const hoverIntent = createSubmenuHoverIntent(
    (value) => {
      submenuOpen = value;
    },
    {
      openDelay: SUBMENU_HOVER_DELAY_MS,
      closeDelay: SUBMENU_HOVER_DELAY_MS,
      aimPause: SUBMENU_AIM_PAUSE_MS,
      getSubmenu: () => (submenuOpen ? submenuRef : null),
    },
  );

  const unsubPosition = ctx.position.subscribe((position) => {
    rootMenuPosition = position;
  });

  function handleClick(event, options = {}) {
    if (disabled) return;
    if (subOptions) return;

    // Selection runs first so preventDefault only skips the close.
    if (ctxGroup) {
      ctxGroup.toggleOption({ id });
    } else if (ctxRadioGroup) {
      if (options.fromKeyboard) {
        ctxRadioGroup.setOption({ id: options.id });
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
      if (unsubCurrentIds) unsubCurrentIds();
      if (unsubCurrentId) unsubCurrentId();
      hoverIntent.cancel();
      typeahead.clear();
    };
  });

  $: isSelectable = !!ctxGroup || selectable;
  $: isRadio = !!ctxRadioGroup;
  $: subOptions = $$slots.default;
  // A shortcut that doesn't parse, such as Carbon React's free-text "⌘C",
  // shows as written, as `shortcutText` would.
  $: parsable = parseShortcut(shortcut) !== null;
  $: ctx.setPopup(submenuOpen);
  // The submenu opens toward the inline end (the left in RTL), flips when
  // it doesn't fit, and pins to the viewport edge when it fits on neither
  // side. The option spans its menu, which starts at `rootMenuPosition`.
  $: if (submenuOpen) {
    const { width, y } = ref.getBoundingClientRect();
    const x = fitMenuAxis({
      before: rootMenuPosition[0],
      after: rootMenuPosition[0] + width,
      size: submenuRef?.getBoundingClientRect().width ?? width,
      max: window.innerWidth,
      reverse: resolveLayoutDirection($layoutDirection, ref) === "rtl",
    });

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
  aria-disabled={disabled ? "true" : "false"}
  aria-haspopup={subOptions ? true : undefined}
  aria-expanded={subOptions ? (submenuOpen ? "true" : "false") : undefined}
  class:bx--menu-option={true}
  class:bx--menu-option--disabled={disabled}
  class:bx--menu-option--active={subOptions && submenuOpen}
  class:bx--menu-option--danger={!subOptions && kind === "danger"}
  aria-checked={isSelectable || isRadio
    ? selected
      ? "true"
      : "false"
    : undefined}
  data-nested={ctx.level === 2}
  data-sub={subOptions}
  data-id={id}
  aria-keyshortcuts={shortcut
    ? ariaKeyShortcuts(shortcut, { apple: $applePlatform }) || undefined
    : undefined}
  {...$$restProps}
  on:keydown
  on:keydown={async (event) => {
    if (
      subOptions &&
      // Keys from the flyout's own items bubble here; only the trigger opens it.
      event.target === ref &&
      ((inlineKey(event.key, $layoutDirection, ref) === "ArrowRight" &&
        !hasModifierKey(event)) ||
        event.key === " " ||
        event.key === "Enter")
    ) {
      if (disabled) return;
      submenuOpen = true;
      await tick();
      options = [...ref.querySelectorAll("li[tabindex]")];
      if (options[focusIndex]) options[focusIndex].focus();
      return;
    }

    if (submenuOpen && !hasModifierKey(event)) {
      if (inlineKey(event.key, $layoutDirection, ref) === "ArrowLeft") {
        event.stopPropagation();
        submenuOpen = false;
        focusIndex = 0;
        ref?.focus({ preventScroll: true });
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        focusIndex = nextEnabledIndex({
          items: options,
          index: focusIndex,
          step: event.key === "ArrowDown" ? 1 : -1,
          wrap: false,
          isDisabled: (item) => item.getAttribute("aria-disabled") === "true",
        });
      } else if (event.key === "Home") {
        if (options.length > 0) focusIndex = 0;
      } else if (event.key === "End" && options.length > 0) {
        focusIndex = options.length - 1;
      } else if (isTypeaheadKey(event)) {
        // WAI-ARIA APG menu first-character navigation, scoped to this
        // submenu's own items (`options`) so it doesn't affect the parent
        // level's typeahead search.
        event.preventDefault();
        const query = typeahead.push(event.key);
        focusIndex = typeaheadIndex({
          items: options,
          query,
          itemToString: menuOptionLabel,
          index: focusIndex,
          isDisabled: (item) => item.getAttribute("aria-disabled") === "true",
        });
      }

      if (options[focusIndex]) options[focusIndex].focus();
    }

    if (event.key === " " || event.key === "Enter") {
      handleClick(event, {
        fromKeyboard: true,
        id: /** @type {Element} */ (event.target).getAttribute("data-id"),
      });
    }
  }}
  on:mouseenter
  on:mouseenter={() => {
    if (subOptions && !disabled) {
      hoverIntent.scheduleOpen();
    }
  }}
  on:mouseleave
  on:mouseleave={(event) => {
    if (subOptions) {
      hoverIntent.scheduleClose(event);
    }
  }}
  on:click={(event) => {
    if (subOptions) {
      event.stopPropagation();
      if (disabled || submenuRef?.contains(/** @type {Node} */ (event.target)))
        return;
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
          <slot name="icon"><svelte:component this={resolvedIcon} /></slot>
        </div>
      {/if}
      <span
        class:bx--menu-option__label={true}
        class:bx--menu-option__label--slotted={!!$$slots.labelChildren}
        title={labelText}
      >
        <slot name="labelChildren">{labelText}</slot>
      </span>
      <div class:bx--menu-option__info={true}><CaretRight /></div>
    </div>

    <ContextMenu
      bind:ref={submenuRef}
      open={submenuOpen}
      x={submenuPosition[0]}
      y={submenuPosition[1]}
      on:close={() => {
        // The flyout closes itself on select, Escape or an outside click.
        submenuOpen = false;
        focusIndex = 0;
      }}
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
          <slot name="icon"><svelte:component this={resolvedIcon} /></slot>
        </div>
      {/if}
      <span
        class:bx--menu-option__label={true}
        class:bx--menu-option__label--slotted={!!$$slots.labelChildren}
        title={labelText}
      >
        <slot name="labelChildren">{labelText}</slot>
      </span>
      <div class:bx--menu-option__info={true}>
        <slot name="shortcutChildren">
          <slot name="shortcutText">
            {#if shortcutText || !shortcut}
              {shortcutText}
            {:else if parsable}
              <Kbd {shortcut} variant="muted" aria-hidden="true" />
            {:else}
              {shortcut}
            {/if}
          </slot>
        </slot>
      </div>
    </div>
  {/if}
</li>
