<script>
  /**
   * Specify the kind of option
   * @type {"default" | "danger"}
   */
  export let kind = "default";

  /** Set to `true` to enable the disabled state */
  export let disabled = false;

  /** Set to `true` to indent the label */
  export let indented = false;

  /**
   * Specify the icon to render
   * Icon is rendered to the left of the label text
   * @type {typeof import("svelte").SvelteComponent}
   */
  export let icon = undefined;

  /**
   * Specify the label text
   * Alternatively, use the "labelText" slot (e.g., <span slot="labelText">...</span>)
   */
  export let labelText = "";

  /** Set to `true` to use the selected variant */
  export let selected = false;

  /**
   * Set to `true` to enable the selectable variant
   * Automatically set to `true` if `selected` is `true`
   */
  export let selectable = false;

  /**
   * Specify the shortcut text
   * Alternatively, use the "shortcutText" slot (e.g., <span slot="shortcutText">...</span>)
   */
  export let shortcutText = "";

  /**
   * Specify the id
   * It's recommended to provide an id as a value to bind to within a selectable/radio menu group
   */
  export let id = "ccs-" + Math.random().toString(36);

  /** Obtain a reference to the list item HTML element */
  export let ref = null;

  import { onMount, getContext, createEventDispatcher, tick } from "svelte";
  import ContextMenu from "./ContextMenu.svelte";
  import Checkmark from "../icons/Checkmark.svelte";
  import CaretRight from "../icons/CaretRight.svelte";

  const dispatch = createEventDispatcher();
  const ctx = getContext("ContextMenu");
  const ctxGroup = getContext("ContextMenuGroup");
  const ctxRadioGroup = getContext("ContextMenuRadioGroup");

  // "moderate-01" duration (ms) from Carbon motion recommended for small expansion, short distance movements
  const moderate01 = 150;

  let unsubCurrentIds = undefined;
  let unsubCurrentId = undefined;
  let timeoutHover = undefined;
  let rootMenuPosition = [0, 0];
  let focusIndex = 0;
  let options = [];
  let role = "menuitem";
  let submenuOpen = false;
  let submenuPosition = [0, 0];
  let menuOffsetX = 0;

  const unsubPosition = ctx.position.subscribe((position) => {
    rootMenuPosition = position;
  });

  const unsubMenuOffsetX = ctx.menuOffsetX.subscribe((_menuOffsetX) => {
    menuOffsetX = _menuOffsetX;
  });

  function handleClick(opts = {}) {
    if (disabled) return ctx.close();
    if (subOptions) return;

    if (!!ctxGroup) {
      ctxGroup.toggleOption({ id });
    } else if (!!ctxRadioGroup) {
      if (opts.fromKeyboard) {
        ctxRadioGroup.setOption({ id: opts.id });
      } else {
        ctxRadioGroup.setOption({ id });
      }
    } else {
      selected = !selected;
    }

    ctx.close();
    dispatch("click");
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
    };
  });

  $: isSelectable = !!ctxGroup || selectable;
  $: isRadio = !!ctxRadioGroup;
  $: subOptions = $$slots.default;
  $: ctx.setPopup(submenuOpen);
  $: if (submenuOpen) {
    const { width, y } = ref.getBoundingClientRect();
    let x = rootMenuPosition[0] + width;

    if (window.innerWidth - menuOffsetX < width) {
      x = rootMenuPosition[0] - width;
    }

    submenuPosition = [x, y];
  }
  $: {
    if (isSelectable) {
      indented = true;
      role = "menuitemcheckbox";

      if (selected) {
        if (ctxGroup) ctxGroup.addOption({ id });
        icon = Checkmark;
      } else {
        icon = undefined;
      }
    }

    if (isRadio) {
      indented = true;
      role = "menuitemradio";
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
  bind:this="{ref}"
  role="{role}"
  tabindex="-1"
  aria-disabled="{!subOptions && disabled}"
  aria-haspopup="{subOptions ? true : undefined}"
  aria-expanded="{subOptions ? submenuOpen : undefined}"
  class:bx--menu-option="{true}"
  class:bx--menu-option--disabled="{true}"
  class:bx--menu-option--active="{subOptions && submenuOpen}"
  class:bx--menu-option--danger="{!subOptions && kind === 'danger'}"
  indented="{indented}"
  aria-checked="{isSelectable || isRadio ? selected : undefined}"
  data-nested="{ref &&
    ref.closest('.bx--menu').getAttribute('data-level') === '2'}"
  data-sub="{subOptions}"
  data-id="{id}"
  {...$$restProps}
  on:keydown
  on:keydown="{async ({ key, target }) => {
    if (
      subOptions &&
      (key === 'ArrowRight' || key === ' ' || key === 'Enter')
    ) {
      submenuOpen = true;
      await tick();
      options = [...ref.querySelectorAll('li[tabindex]')];
      if (options[focusIndex]) options[focusIndex].focus();
      return;
    }

    if (submenuOpen) {
      if (key === 'ArrowLeft') {
        submenuOpen = false;
        focusIndex = 0;
        return;
      }

      if (key === 'ArrowDown') {
        if (focusIndex < options.length - 1) focusIndex++;
      } else if (key === 'ArrowUp') {
        if (focusIndex === -1) {
          focusIndex = options.length - 1;
        } else {
          if (focusIndex > 0) focusIndex--;
        }
      }

      if (options[focusIndex]) options[focusIndex].focus();
    }

    if (key === ' ' || key === 'Enter') {
      handleClick({ fromKeyboard: true, id: target.getAttribute('data-id') });
    }
  }}"
  on:mouseenter
  on:mouseenter="{() => {
    if (subOptions) {
      timeoutHover = setTimeout(() => {
        submenuOpen = true;
      }, moderate01);
    }
  }}"
  on:mouseleave
  on:mouseleave="{(e) => {
    if (subOptions) {
      if (typeof timeoutHover === 'number') clearTimeout(timeoutHover);
      submenuOpen = false;
    }
  }}"
  on:click="{handleClick}"
>
  {#if subOptions}
    <div
      class:bx--menu-option__content="{true}"
      class:bx--menu-option__content--disabled="{disabled}"
    >
      {#if indented}
        <div class:bx--menu-option__icon="{true}">
          <slot name="icon">
            <svelte:component this="{icon}" />
          </slot>
        </div>
      {/if}
      <span class:bx--menu-option__label="{true}" title="{labelText}">
        <slot name="labelText">{labelText}</slot>
      </span>
      <div class:bx--menu-option__info="{true}"><CaretRight /></div>
    </div>

    <ContextMenu
      open="{submenuOpen}"
      x="{submenuPosition[0]}"
      y="{submenuPosition[1]}"
    >
      <slot />
    </ContextMenu>
  {:else}
    <div
      class:bx--menu-option__content="{true}"
      class:bx--menu-option__content--disabled="{disabled}"
    >
      {#if indented}
        <div class:bx--menu-option__icon="{true}">
          <slot name="icon">
            <svelte:component this="{icon}" />
          </slot>
        </div>
      {/if}
      <span class:bx--menu-option__label="{true}" title="{labelText}">
        <slot name="labelText">{labelText}</slot>
      </span>
      <div class:bx--menu-option__info="{true}">
        <slot name="shortcutText">{shortcutText}</slot>
      </div>
    </div>
  {/if}
</li>
