<script>
  export let direction = "bottom";
  export let hideIcon = false;
  export let icon = Information16;
  export let iconDescription = "";
  export let iconName = "";
  export let open = false;
  export let tabindex = "0";
  export let tooltipId = "ccs-" + Math.random().toString(36);
  export let triggerId = "ccs-" + Math.random().toString(36);
  export let triggerText = "";
  export let ref = null;
  export let refTooltip = null;
  export let refIcon = null;

  import { createEventDispatcher, afterUpdate } from "svelte";
  import Information16 from "carbon-icons-svelte/lib/Information16";

  const dispatch = createEventDispatcher();

  $: programmatic = true;

  function onKeydown(e) {
    if (e.key === "Escape") {
      e.stopPropagation();
      open = false;
    } else if (e.key === " " || e.key === "Enter") {
      e.stopPropagation();
      e.preventDefault();
      open = true;
    }
  }

  function onBlur({ relatedTarget }) {
    if (refTooltip && !refTooltip.contains(relatedTarget)) {
      open = false;
    }
  }

  function openMenu() {
    programmatic = false;
    open = true;
  }

  function closeMenu() {
    programmatic = false;
    open = false;
  }

  afterUpdate(() => {
    if (open) {
      const button = ref.getBoundingClientRect();
      const tooltip = refTooltip.getBoundingClientRect();

      let iconWidth = 16;
      let iconHeight = 16;

      if (refIcon) {
        const icon = refIcon.getBoundingClientRect();
        iconWidth = icon.width;
        iconHeight = icon.height;
      }

      let offsetX = 0;
      let offsetY = 0;

      switch (direction) {
        case "bottom":
          if (hideIcon) {
            offsetX = -1 * (tooltip.width / 2 - button.width / 2);
          } else {
            offsetX = -1 * (tooltip.width / 2 - button.width + iconWidth / 2);
          }
          offsetY = iconHeight / 2;
          break;
        case "right":
          offsetX = button.width + 6;
          offsetY = -1 * (tooltip.height / 2 + iconWidth / 2 - 3);
          break;
        case "left":
          if (hideIcon) {
            offsetX = -1 * (tooltip.width + 6 + 1);
          } else {
            offsetX = -1 * (tooltip.width - button.width + iconWidth + 8);
          }
          offsetY = -1 * (tooltip.height / 2 + button.height) - 2;
          break;
        case "top":
          if (hideIcon) {
            offsetX = -1 * (tooltip.width / 2 - button.width / 2);
          } else {
            offsetX =
              -1 * (tooltip.width / 2 - button.width + iconWidth / 2 + 1);
          }
          offsetY = -1 * (tooltip.height + button.height + iconWidth / 2 - 1);
          break;
      }

      refTooltip.style.left = offsetX + "px";
      refTooltip.style.marginTop = offsetY + "px";
    }
  });

  $: dispatch(open ? "open" : "close");
  $: buttonProps = {
    role: "button",
    "aria-haspopup": "true",
    id: hideIcon ? triggerId : undefined,
    class: hideIcon ? "bx--tooltip__label" : "bx--tooltip__trigger",
    "aria-expanded": open,
    "aria-describedby": open ? tooltipId : undefined,
    "aria-labelledby": triggerText ? triggerId : undefined,
    "aria-label": triggerText ? iconDescription : undefined,
    tabindex,
    style: hideIcon ? $$restProps.style : undefined
  };
</script>

<svelte:body
  on:click={({ target }) => {
    if (!programmatic && open && refTooltip && !refTooltip.contains(target)) {
      open = false;
    }
  }} />

<div {...$$restProps} style="{$$restProps.style}; position: relative;">
  {#if !hideIcon}
    <div bind:this={ref} id={triggerId} class:bx--tooltip__label={true}>
      <slot name="triggerText">{triggerText}</slot>
      <div
        bind:this={refIcon}
        {...buttonProps}
        on:click|preventDefault|stopPropagation={openMenu}
        on:focus={openMenu}
        on:blur={onBlur}
        on:keydown={onKeydown}>
        <slot name="icon">
          <svelte:component this={icon} name={iconName} />
        </slot>
      </div>
    </div>
  {:else}
    <div
      bind:this={ref}
      {...buttonProps}
      on:click|preventDefault|stopPropagation={openMenu}
      on:focus={openMenu}
      on:blur={onBlur}
      on:keydown={onKeydown}>
      <slot name="triggerText">{triggerText}</slot>
    </div>
  {/if}
  {#if open}
    <div
      bind:this={refTooltip}
      role="tooltip"
      tabindex="0"
      id={tooltipId}
      data-floating-menu-direction={direction}
      class:bx--tooltip={true}
      class:bx--tooltip--shown={open}
      on:blur={closeMenu}>
      <span class:bx--tooltip__caret={true} />
      <slot />
    </div>
  {/if}
</div>
