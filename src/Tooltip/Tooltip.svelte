<script>
  /**
   * @event {null} open
   * @event {null} close
   */

  /**
   * Set the alignment of the tooltip relative to the icon
   * @type {"top" | "top-left" | "top-right" | "bottom" | "bottom-left" | "bottom-right" | "left" | "left-bottom" | "left-top" | "right" | "right-bottom" | "right-top"}
   */
  export let align = "bottom";

  /**
   * Set to `true` to open the tooltip
   * @type {boolean}
   */
  export let open = false;

  /**
   * Specify the icon to render for the tooltip button.
   * Default to `<Information />`
   * @type {typeof import("svelte").SvelteComponent<any>}
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

  /**
   * Set the tooltip button text
   * This is deprecated. Use default slot instead
   */
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
  import Popover from "../Popover/Popover.svelte";
  import PopoverContent from "../Popover/PopoverContent.svelte";

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
    }
  });

  $: tooltipOpen.set(open);
  $: dispatch(open ? "open" : "close");
  $: buttonProps = {
    role: "button",
    "aria-haspopup": "true",
    "aria-expanded": open,
    "aria-describedby": open ? tooltipId : undefined,
    "aria-labelledby": triggerText ? triggerId : undefined,
    "aria-label": triggerText ? undefined : iconDescription,
    tabindex,
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
  style:position="relative"
  style:z-index="{open ? 1 : undefined}"
  {...$$restProps}
>
  <div bind:this="{ref}" id="{triggerId}">
    <!-- todo: remove this. it’s only kept for legacy. -->
    <slot name="triggerText">{triggerText}</slot>
    <Popover bind:open highContrast align="{align}">
      <!-- svelte-ignore a11y-no-static-element-interactions -->
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
      <PopoverContent
        className="{'bx--tooltip-content'}"
        bind:ref="{refTooltip}"
      >
        <slot />
      </PopoverContent>
    </Popover>
  </div>
</div>
