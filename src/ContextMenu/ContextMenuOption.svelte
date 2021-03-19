<script>
  export let disabled = false;
  export let icon = undefined;
  export let indented = false;
  export let label = "";
  export let selected = false;
  export let selectable = false;
  export let shortcut = "";
  export let id = "ccs-" + Math.random().toString(36);
  export let ref = null;

  import { onMount, getContext, createEventDispatcher } from "svelte";
  import ContextMenu from "./ContextMenu.svelte";
  import Checkmark16 from "carbon-icons-svelte/lib/Checkmark16/Checkmark16.svelte";
  import CaretRight16 from "carbon-icons-svelte/lib/CaretRight16/CaretRight16.svelte";

  const dispatch = createEventDispatcher();
  const ctx = getContext("ContextMenu");
  const ctxGroup = getContext("ContextMenuGroup");
  const ctxRadioGroup = getContext("ContextMenuRadioGroup");

  let unsubCurrentIds = undefined;
  let unsubCurrentId = undefined;
  let initialSelected = false;
  let timeoutHover = undefined;
  let rootMenuPosition = [0, 0];

  const unsubPosition = ctx.position.subscribe((position) => {
    rootMenuPosition = position;
  });

  onMount(() => {
    initialSelected = selected;

    if (ctxGroup) {
      unsubCurrentIds = ctxGroup.currentIds.subscribe((ids) => {
        selected = ids.includes(id);
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
      if (typeof timeoutHover === "number") clearTimeout(timeoutHover);
    };
  });

  $: isSelectable = !!ctxGroup || initialSelected || selectable;
  $: isRadio = !!ctxRadioGroup;

  $: if (isSelectable) {
    indented = true;

    if (selected) {
      if (ctxGroup) ctxGroup.addOption({ id });
      icon = Checkmark16;
    } else {
      icon = undefined;
    }
  }

  let submenuOpen = false;
  let submenuPosition = [0, 0];

  $: subOptions = $$slots.default;
  $: if (submenuOpen) {
    const { width, y } = ref.getBoundingClientRect();
    submenuPosition = [rootMenuPosition[0] + width, y];
  }

  let role = "menuitem";

  $: {
    if (isSelectable) role = "menuitemcheckbox";
    if (isRadio) {
      role = "menuitemradio";

      if (selected) {
        if (ctxRadioGroup) ctxRadioGroup.setOption({ id });
        icon = Checkmark16;
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
  class:bx--context-menu-option="{true}"
  class:bx--context-menu-option--disabled="{true}"
  class:bx--context-menu-option--active="{subOptions && submenuOpen}"
  indented="{isSelectable || isRadio}"
  aria-checked="{isSelectable || isRadio ? selected : undefined}"
  {...$$restProps}
  on:keydown
  on:keydown="{(e) => {}}"
  on:mouseenter
  on:mouseenter="{(e) => {
    if (subOptions) {
      timeoutHover = setTimeout(() => {
        submenuOpen = true;
      }, 150);
    }
  }}"
  on:mouseleave
  on:mouseleave="{(e) => {
    if (subOptions) {
      if (typeof timeoutHover === 'number') clearTimeout(timeoutHover);
      submenuOpen = false;
    }
  }}"
  on:click="{() => {
    if (disabled) return ctx.close();
    if (subOptions) return;

    if (!!ctxGroup) {
      ctxGroup.toggleOption({ id });
    } else if (!!ctxRadioGroup) {
      ctxRadioGroup.setOption({ id });
    } else {
      console.log('toggle');
      selected = !selected;
    }

    ctx.close();
    dispatch('click');
  }}"
>
  {#if subOptions}
    <div
      data-nested="{true}"
      class:bx--context-menu-option__content="{true}"
      class:bx--context-menu-option__content--disabled="{disabled}"
    >
      {#if indented}
        <div class:bx--context-menu-option__icon="{true}">
          <svelte:component this="{icon}" />
        </div>
      {/if}
      <span class:bx--context-menu-option__label="{true}" title="{label}">
        {label}
      </span>
      <div class:bx--context-menu-option__info="{true}"><CaretRight16 /></div>
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
      class:bx--context-menu-option__content="{true}"
      class:bx--context-menu-option__content--disabled="{disabled}"
    >
      {#if indented}
        <div class:bx--context-menu-option__icon="{true}">
          <svelte:component this="{icon}" />
        </div>
      {/if}
      <span class:bx--context-menu-option__label="{true}" title="{label}">
        {label}
      </span>
      <div class:bx--context-menu-option__info="{true}">{shortcut}</div>
    </div>
  {/if}
</li>
