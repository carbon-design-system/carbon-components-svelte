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
   * @type {any}
   */
  export let icon = undefined;

  /**
   * Specify the label text.
   * Alternatively, use the "labelText" slot (e.g., `<span slot="labelText">...</span>`)
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
   * Specify the shortcut text.
   * Alternatively, use the "shortcutText" slot (e.g., `<span slot="shortcutText">...</span>`)
   */
  export let shortcutText = "";

  /**
   * Specify the id
   * It's recommended to provide an id as a value to bind to within a selectable/radio menu group
   */
  export let id = "ccs-" + Math.random().toString(36);

  /** Obtain a reference to the list item HTML element */
  export let ref = null;

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import CaretRight from "../icons/CaretRight.svelte";
  import Checkmark from "../icons/Checkmark.svelte";
  import ContextMenu from "./ContextMenu.svelte";

  const dispatch = createEventDispatcher();
  const ctx = getContext("ContextMenu");
  const ctxGroup = getContext("ContextMenuGroup");
  const ctxRadioGroup = getContext("ContextMenuRadioGroup");

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
  let mousePosition = { x: 0, y: 0 };
  /** @type {HTMLUListElement | null} */
  let submenuRef = null;

  const unsubPosition = ctx.position.subscribe((position) => {
    rootMenuPosition = position;
  });

  const unsubMenuOffsetX = ctx.menuOffsetX.subscribe((_menuOffsetX) => {
    menuOffsetX = _menuOffsetX;
  });

  function isPointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
    const denominator = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
    const a = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / denominator;
    const b = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / denominator;
    const c = 1 - a - b;

    return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1;
  }

  // Utility function to check if mouse is in the
  // safe triangle when transferring to the submenu.
  function isInSafeTriangle(mouseX, mouseY) {
    if (!submenuOpen || !ref || !submenuRef) return false;

    const parentRect = ref.getBoundingClientRect();
    const submenuRect = submenuRef.getBoundingClientRect();

    // Magic number to make the triangle slightly larger
    const buffer = 12;
    const isSubmenuOnRight = submenuRect.left >= parentRect.right;

    let trianglePoints;
    if (isSubmenuOnRight) {
      trianglePoints = {
        x1: parentRect.right,
        y1: parentRect.top - buffer,
        x2: parentRect.right,
        y2: parentRect.bottom + buffer,
        x3: submenuRect.left,
        y3: submenuRect.top + submenuRect.height / 2,
      };
    } else {
      trianglePoints = {
        x1: parentRect.left,
        y1: parentRect.top - buffer,
        x2: parentRect.left,
        y2: parentRect.bottom + buffer,
        x3: submenuRect.right,
        y3: submenuRect.top + submenuRect.height / 2,
      };
    }

    const inTopTriangle = isPointInTriangle(
      mouseX,
      mouseY,
      trianglePoints.x1,
      trianglePoints.y1,
      isSubmenuOnRight ? trianglePoints.x3 : trianglePoints.x2,
      submenuRect.top,
      trianglePoints.x3,
      trianglePoints.y3,
    );

    const inBottomTriangle = isPointInTriangle(
      mouseX,
      mouseY,
      trianglePoints.x2,
      trianglePoints.y2,
      trianglePoints.x3,
      trianglePoints.y3,
      isSubmenuOnRight ? trianglePoints.x3 : trianglePoints.x1,
      submenuRect.bottom,
    );

    return inTopTriangle || inBottomTriangle;
  }

  function handleClick(opts = {}) {
    if (disabled) return ctx.close();
    if (subOptions) return;

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

    ctx.close();
    dispatch("click");
  }

  function handleGlobalMouseMove(e) {
    if (subOptions && submenuOpen) {
      mousePosition = { x: e.clientX, y: e.clientY };

      if (isInSafeTriangle(e.clientX, e.clientY)) {
        if (typeof timeoutClose === "number") {
          clearTimeout(timeoutClose);
          timeoutClose = undefined;
        }
      }
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

    window.addEventListener("mousemove", handleGlobalMouseMove);

    return () => {
      unsubPosition();
      unsubMenuOffsetX();
      if (unsubCurrentIds) unsubCurrentIds();
      if (unsubCurrentId) unsubCurrentId();
      if (typeof timeoutHover === "number") clearTimeout(timeoutHover);
      if (typeof timeoutClose === "number") clearTimeout(timeoutClose);
      window.removeEventListener("mousemove", handleGlobalMouseMove);
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
  bind:this={ref}
  {role}
  tabindex="-1"
  aria-disabled={!subOptions && disabled}
  aria-haspopup={subOptions ? true : undefined}
  aria-expanded={subOptions ? submenuOpen : undefined}
  class:bx--menu-option={true}
  class:bx--menu-option--disabled={true}
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
  on:keydown={async ({ key, target }) => {
    if (
      subOptions &&
      (key === "ArrowRight" || key === " " || key === "Enter")
    ) {
      submenuOpen = true;
      await tick();
      options = [...ref.querySelectorAll("li[tabindex]")];
      if (options[focusIndex]) options[focusIndex].focus();
      return;
    }

    if (submenuOpen) {
      if (key === "ArrowLeft") {
        submenuOpen = false;
        focusIndex = 0;
        return;
      }

      if (key === "ArrowDown") {
        if (focusIndex < options.length - 1) focusIndex++;
      } else if (key === "ArrowUp") {
        if (focusIndex === -1) {
          focusIndex = options.length - 1;
        } else {
          if (focusIndex > 0) focusIndex--;
        }
      }

      if (options[focusIndex]) options[focusIndex].focus();
    }

    if (key === " " || key === "Enter") {
      handleClick({ fromKeyboard: true, id: target.getAttribute("data-id") });
    }
  }}
  on:mouseenter
  on:mouseenter={() => {
    if (subOptions) {
      if (typeof timeoutClose === "number") {
        clearTimeout(timeoutClose);
        timeoutClose = undefined;
      }

      timeoutHover = setTimeout(() => {
        submenuOpen = true;
      }, moderate01);
    }
  }}
  on:mousemove={(e) => {
    if (subOptions && submenuOpen) {
      mousePosition = { x: e.clientX, y: e.clientY };
    }
  }}
  on:mouseleave
  on:mouseleave={(e) => {
    if (subOptions) {
      if (typeof timeoutHover === "number") clearTimeout(timeoutHover);

      timeoutClose = setTimeout(() => {
        if (!isInSafeTriangle(mousePosition.x, mousePosition.y)) {
          submenuOpen = false;
        }
      }, closeDelay);
    }
  }}
  on:click={(e) => {
    if (subOptions) {
      e.stopPropagation();
      submenuOpen = true;
      return;
    }
    handleClick();
  }}
>
  {#if subOptions}
    <div
      class:bx--menu-option__content={true}
      class:bx--menu-option__content--disabled={disabled}
    >
      {#if indented}
        <div class:bx--menu-option__icon={true}>
          <slot name="icon">
            <svelte:component this={icon} />
          </slot>
        </div>
      {/if}
      <span class:bx--menu-option__label={true} title={labelText}>
        <slot name="labelText">{labelText}</slot>
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
      {#if indented}
        <div class:bx--menu-option__icon={true}>
          <slot name="icon">
            <svelte:component this={icon} />
          </slot>
        </div>
      {/if}
      <span class:bx--menu-option__label={true} title={labelText}>
        <slot name="labelText">{labelText}</slot>
      </span>
      <div class:bx--menu-option__info={true}>
        <slot name="shortcutText">{shortcutText}</slot>
      </div>
    </div>
  {/if}
</li>
