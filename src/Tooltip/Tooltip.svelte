<script>
  /**
   * @event {null} open
   * @event {null} close
   */

  /**
   * Set the alignment of the tooltip relative to the icon
   * @type {"start" | "center" | "end"}
   */
  export let align = "center";

  /**
   * Set the direction of the tooltip relative to the button
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let direction = "bottom";

  /**
   * Set to `true` to open the tooltip
   * @type {boolean}
   */
  export let open = false;

  /**
   * Set to `true` to hide the tooltip icon
   * @type {boolean}
   */
  export let hideIcon = false;

  /**
   * Specify the icon to render for the tooltip button.
   * Default to `<Information />`
   * @type {typeof import("svelte").SvelteComponent}
   */
  export let icon = Information;

  /** Specify the ARIA label for the tooltip button */
  export let iconDescription = "";

  /** Specify the icon name attribute */
  export let iconName = "";

  /** Set the button tabindex */
  export let tabindex = "0";

  /**
   * Set an id for the tooltip
   * @type {string}
   */
  export let tooltipId = "ccs-" + Math.random().toString(36);

  /**
   * Set an id for the tooltip button
   * @type {string}
   */
  export let triggerId = "ccs-" + Math.random().toString(36);

  /** Set the tooltip button text */
  export let triggerText = "";

  /** Obtain a reference to the trigger text HTML element */
  export let ref = null;

  /** Obtain a reference to the tooltip HTML element */
  export let refTooltip = null;

  /** Obtain a reference to the icon HTML element */
  export let refIcon = null;

  import { createEventDispatcher, afterUpdate, setContext } from "svelte";
  import { writable } from "svelte/store";
  import Information from "../icons/Information.svelte";

  const dispatch = createEventDispatcher();
  const tooltipOpen = writable(open);

  setContext("Tooltip", { tooltipOpen });

  function onKeydown(e) {
    if (e.key === "Escape" || e.key === "Tab") {
      e.stopPropagation();
      if (e.key === "Escape") refIcon?.focus();
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

  function onFocus() {
    open = true;
  }

  function onMousedown() {
    // determine the desired state before the focus event triggers.
    const shouldClose = open;
    // ensure changes are scheduled at the end, i.e. after the possible focus event.
    setTimeout(() => {
      open = shouldClose ? false : true;
    });
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

  $: tooltipOpen.set(open);
  $: dispatch(open ? "open" : "close");
  $: buttonProps = {
    role: "button",
    "aria-haspopup": "true",
    id: hideIcon ? triggerId : undefined,
    class: hideIcon ? "bx--tooltip__label" : "bx--tooltip__trigger",
    "aria-expanded": open,
    "aria-describedby": open ? tooltipId : undefined,
    "aria-labelledby": triggerText ? triggerId : undefined,
    "aria-label": triggerText ? undefined : iconDescription,
    tabindex,
    style: hideIcon ? $$restProps.style : undefined,
  };
</script>

<svelte:window
  on:mousedown="{({ target }) => {
    if (open) {
      if (target.contains(refTooltip)) {
        if (refIcon) {
          refIcon.focus();
        } else if (ref) {
          ref.focus();
        }
      }
    }
  }}"
  on:click|capture="{({ target }) => {
    if (open && !ref.contains(target) && !refTooltip.contains(target)) {
      setTimeout(() => {
        open = false;
      });
    }
  }}"
/>

<div
  {...$$restProps}
  style="{open ? 'z-index: 1;' : ''}{$$restProps.style}; position: relative;"
>
  {#if !hideIcon}
    <div bind:this="{ref}" id="{triggerId}" class:bx--tooltip__label="{true}">
      <slot name="triggerText">{triggerText}</slot>
      <div
        bind:this="{refIcon}"
        {...buttonProps}
        aria-describedby="{tooltipId}"
        on:mousedown="{onMousedown}"
        on:focus="{onFocus}"
        on:keydown="{onKeydown}"
      >
        <slot name="icon">
          <svelte:component this="{icon}" name="{iconName}" />
        </slot>
      </div>
    </div>
  {:else}
    <div
      bind:this="{ref}"
      {...buttonProps}
      aria-describedby="{tooltipId}"
      on:mousedown="{onMousedown}"
      on:focus="{onFocus}"
      on:blur="{onBlur}"
      on:keydown="{onKeydown}"
    >
      <slot name="triggerText">{triggerText}</slot>
    </div>
  {/if}
  {#if open}
    <div
      bind:this="{refTooltip}"
      id="{tooltipId}"
      data-floating-menu-direction="{direction}"
      class:bx--tooltip="{true}"
      class:bx--tooltip--shown="{open}"
      class:bx--tooltip--top="{direction === 'top'}"
      class:bx--tooltip--right="{direction === 'right'}"
      class:bx--tooltip--bottom="{direction === 'bottom'}"
      class:bx--tooltip--left="{direction === 'left'}"
      class:bx--tooltip--align-center="{align === 'center'}"
      class:bx--tooltip--align-start="{align === 'start'}"
      class:bx--tooltip--align-end="{align === 'end'}"
      on:keydown="{onKeydown}"
    >
      <span class:bx--tooltip__caret="{true}"></span>
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        on:click|stopPropagation
        on:mousedown|stopPropagation
        class:bx--tooltip__content="{true}"
        tabIndex="-1"
        role="dialog"
      >
        <slot />
      </div>
    </div>
  {/if}
</div>
