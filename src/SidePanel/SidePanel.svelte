<script>
  /**
   * @restProps {div}
   * @slot {{}}
   * @slot {{}} actions - Footer actions, typically an ActionSet.
   * @slot {{}} toolbar - Secondary header-row actions, real Button children.
   * @slot {{}} decorator - Typically an AI-label badge, rendered top-right of the header.
   * @event {{ trigger: "close-button" | "escape-key" | "overlay-click" | "programmatic" }} close - Fires on a request to close (close button, Escape, overlay click). Call `event.preventDefault()` to stop `open` from being set to `false`.
   * @event {null} back - Fires when the back button (shown when `currentStep` is greater than 0) is clicked.
   */

  /**
   * Whether the panel is open.
   * @bindable writable
   */
  export let open = false;

  /**
   * Specify a custom id.
   * @type {string}
   */
  export let id = uniqueId();

  /**
   * Specify the title text.
   * @type {string}
   */
  export let title = undefined;

  /**
   * Specify the subtitle text.
   * @type {string}
   */
  export let subtitle = undefined;

  /**
   * Specify a small label shown above the title. Only takes effect when
   * `title` is also set.
   * @type {string}
   */
  export let labelText = undefined;

  /**
   * Which screen edge the panel is docked to.
   * @type {"left" | "right"}
   */
  export let placement = "right";

  /**
   * Specify the panel width.
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | "2xl"}
   */
  export let size = "md";

  /**
   * Set to `true` for the slide-in variant, which shrinks
   * `selectorPageContent` instead of overlaying it. Disables Escape-to-close
   * and `resizable`.
   */
  export let slideIn = false;

  /**
   * CSS selector for the page content element to shrink. Required when
   * `slideIn` is `true`.
   * @type {string}
   */
  export let selectorPageContent = undefined;

  /**
   * Set to `true` to render a dim overlay behind the panel. Clicking it
   * closes the panel unless `preventCloseOnClickOutside` is set.
   */
  export let includeOverlay = false;

  /** Set to `true` to prevent the overlay click from closing the panel. */
  export let preventCloseOnClickOutside = false;

  /** Set to `true` to hide the close button. */
  export let hideCloseButton = false;

  /** Specify the close button's accessible label. */
  export let closeIconDescription = "Close";

  /**
   * Set to `true` to let the panel be resized by dragging its edge. Has no
   * effect when `slideIn` is `true`, or on narrow (768px and under) viewports.
   */
  export let resizable = false;

  /**
   * Specify the current step for multi-step content. Greater than `0` shows
   * a back button in the header.
   */
  export let currentStep = 0;

  /** Specify the back button's accessible label. */
  export let navigationBackIconDescription = "Back";

  /**
   * CSS selector for the element to focus when the panel opens. Falls back
   * to the first form input, then the close button.
   * @type {string}
   */
  export let selectorPrimaryFocus = undefined;

  /** Set to `true` for a condensed footer action layout. */
  export let condensedActions = false;

  /**
   * Customize the panel's enter/exit transition (e.g., `transition={{ duration: 240 }}`).
   * The panel does not animate by default; provide fly params to enable the
   * transition.
   * @type {false | import("svelte/transition").FlyParams}
   */
  export let transition = false;

  /**
   * Obtain a reference to the outer HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, onMount, tick } from "svelte";
  import { fade, fly } from "svelte/transition";
  import Button from "../Button/Button.svelte";
  import Heading from "../Heading/Heading.svelte";
  import ArrowLeft from "../icons/ArrowLeft.svelte";
  import Close from "../icons/Close.svelte";
  import Resizer from "../Resizer/Resizer.svelte";
  import { initialFocus, restoreFocus } from "../utils/focus.js";
  import { trapFocus } from "../utils/trapFocus.js";
  import { uniqueId } from "../utils/uniqueId.js";

  const dispatch = createEventDispatcher();
  const focusReturn = restoreFocus();

  const SIZE_WIDTH_REM = { xs: 16, sm: 20, md: 30, lg: 40, xl: 65, "2xl": 80 };
  const MOTION_DURATION = 240;
  const MOTION_DISTANCE = 320;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  let closeButtonRef = null;
  let opened = false;
  let widthOverridePx = undefined;
  let resizeBaseline = 0;

  function close(trigger) {
    const shouldContinue = dispatch("close", { trigger }, { cancelable: true });
    if (shouldContinue) {
      open = false;
    }
  }

  function focusPanel() {
    const node = initialFocus({
      container: ref,
      selectorPrimaryFocus,
      fallbacks: [closeButtonRef],
    });
    node?.focus();
  }

  onMount(() => {
    if (open) {
      focusReturn.save();
      tick().then(() => {
        if (open) focusPanel();
      });
    }

    return () => {
      if (slideIn && selectorPageContent && typeof document !== "undefined") {
        const pageContentElement = document.querySelector(selectorPageContent);
        if (pageContentElement instanceof HTMLElement) {
          pageContentElement.style.marginInlineEnd = "0";
          pageContentElement.style.marginInlineStart = "0";
        }
      }
    };
  });

  // Mirrors Modal's own open/close bookkeeping: track a local `opened` flag
  // to detect the open -> close and close -> open transitions from a single
  // reactive block, since reactive statements run before the DOM (and thus
  // `ref`, bound inside the `{#if open}` block below) commits.
  $: {
    if (opened) {
      if (!open) {
        opened = false;
      }
    } else if (open) {
      opened = true;
      focusReturn.save();
      tick().then(() => {
        if (open) focusPanel();
      });
    }
  }

  function handleOutroEnd() {
    focusReturn.restore();
    widthOverridePx = undefined;
  }

  function panelTransition(node) {
    if (transition === false) {
      return fly(node, { duration: 0 });
    }
    if (prefersReducedMotion) {
      return fade(node, { duration: transition.duration ?? MOTION_DURATION });
    }
    return fly(node, {
      x: placement === "right" ? MOTION_DISTANCE : -MOTION_DISTANCE,
      duration: MOTION_DURATION,
      ...transition,
    });
  }

  $: transitionDuration =
    transition === false ? 0 : (transition.duration ?? MOTION_DURATION);

  function handleKeyDown(event) {
    if (slideIn) return;
    if (event.key === "Escape") {
      event.stopPropagation();
      close("escape-key");
    } else if (event.key === "Tab") {
      trapFocus({ container: ref, event });
    }
  }

  function handleOverlayClick() {
    if (!preventCloseOnClickOutside) close("overlay-click");
  }

  function handleResizeStart() {
    resizeBaseline = ref?.clientWidth ?? SIZE_WIDTH_REM[size] * 16;
  }

  function handleResize(event) {
    event.preventDefault();
    const delta = event.detail.delta;
    const next = resizeBaseline - (placement === "right" ? delta : -delta);
    const min = SIZE_WIDTH_REM.xs * 16;
    const max = window.innerWidth * 0.75;
    widthOverridePx = Math.max(min, Math.min(next, max));
  }

  function handleResizeDoubleClick(event) {
    event.preventDefault();
    widthOverridePx = undefined;
  }

  $: canResize =
    resizable &&
    !slideIn &&
    typeof window !== "undefined" &&
    window.innerWidth > 768;

  $: panelWidthPercent =
    typeof window !== "undefined" && ref
      ? Math.round((ref.clientWidth / window.innerWidth) * 100)
      : 0;

  // Shrink (or reset) the page content element for the slideIn variant.
  $: if (typeof document !== "undefined" && slideIn && selectorPageContent) {
    const pageContentElement = document.querySelector(selectorPageContent);
    const marginProp =
      placement === "right" ? "marginInlineEnd" : "marginInlineStart";

    if (pageContentElement instanceof HTMLElement) {
      if (open) {
        pageContentElement.style.inlineSize = "auto";
        pageContentElement.style.transition =
          prefersReducedMotion || transitionDuration === 0
            ? ""
            : `margin ${transitionDuration}ms`;
        pageContentElement.style[marginProp] = `${SIZE_WIDTH_REM[size]}rem`;
      } else {
        pageContentElement.style[marginProp] = "0";
      }
    } else {
      console.warn(
        `[SidePanel.svelte] \`selectorPageContent\` ("${selectorPageContent}") did not match any element. The panel will render as a slide over.`,
      );
    }
  }

  $: if (!title && labelText) {
    console.warn(
      "[SidePanel.svelte] `labelText` was provided without `title`. `labelText` only renders when `title` is also set.",
    );
  }

  $: panelClass = [
    "bx--side-panel",
    `bx--side-panel--${size}`,
    placement === "right"
      ? "bx--side-panel--right-placement"
      : "bx--side-panel--left-placement",
    slideIn && "bx--side-panel--slide-in",
    canResize && "bx--side-panel--resizable",
    $$slots.decorator && "bx--side-panel--has-decorator",
    includeOverlay && "bx--side-panel--has-overlay",
    condensedActions && "bx--side-panel--condensed-actions",
    $$restProps.class,
  ]
    .filter(Boolean)
    .join(" ");
</script>

{#if open}
  {#if includeOverlay}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class:bx--side-panel__overlay={true}
      transition:fade={{ duration: transitionDuration }}
      on:click={handleOverlayClick}
    ></div>
  {/if}
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <aside
    bind:this={ref}
    {...$$restProps}
    {id}
    class={panelClass}
    aria-label={title || $$restProps["aria-label"]}
    tabindex="-1"
    transition:panelTransition|local
    on:outroend={handleOutroEnd}
    on:keydown={handleKeyDown}
    style:inline-size={widthOverridePx ? `${widthOverridePx}px` : undefined}
  >
    {#if canResize}
      <Resizer
        orientation="vertical"
        class="bx--side-panel__resizer"
        aria-label={`side panel is covering ${panelWidthPercent}% of screen`}
        aria-valuemin={Math.round((SIZE_WIDTH_REM.xs * 16 * 100) / window.innerWidth)}
        aria-valuemax={75}
        aria-valuenow={panelWidthPercent}
        on:resizestart={handleResizeStart}
        on:resize={handleResize}
        on:dblclick={handleResizeDoubleClick}
      />
    {/if}

    <div
      class:bx--side-panel__header={true}
      class:bx--side-panel__header--on-detail-step={currentStep > 0}
    >
      {#if currentStep > 0}
        <Button
          kind="ghost"
          size="small"
          icon={ArrowLeft}
          iconDescription={navigationBackIconDescription}
          tooltipPosition="bottom"
          tooltipAlignment={placement === "left" ? "start" : "center"}
          class="bx--side-panel__navigation-back-button"
          on:click={() => dispatch("back")}
        />
      {/if}
      {#if title && labelText}
        <p class:bx--side-panel__label-text={true}>{labelText}</p>
      {/if}
      {#if title}
        <div class:bx--side-panel__title={true}>
          <Heading class="bx--side-panel__title-text">{title}</Heading>
        </div>
      {/if}
      {#if $$slots.decorator || !hideCloseButton}
        <div class:bx--side-panel__decorator-and-close={true}>
          <slot name="decorator" />
          {#if !hideCloseButton}
            <Button
              bind:ref={closeButtonRef}
              kind="ghost"
              size="small"
              icon={Close}
              iconDescription={closeIconDescription}
              tooltipPosition="bottom"
              tooltipAlignment={placement === "right" ? "end" : "center"}
              class="bx--side-panel__close-button"
              on:click={() => close("close-button")}
            />
          {/if}
        </div>
      {/if}
      {#if subtitle}
        <p class:bx--side-panel__subtitle-text={true}>{subtitle}</p>
      {/if}
      {#if $$slots.toolbar}
        <div class:bx--side-panel__action-toolbar={true}>
          <slot name="toolbar" />
        </div>
      {/if}
    </div>

    <div class:bx--side-panel__inner-content={true}>
      <slot />
    </div>

    {#if $$slots.actions}
      <div
        class:bx--side-panel__actions-container={true}
        class:bx--side-panel__actions-container--condensed={condensedActions}
      >
        <slot name="actions" />
      </div>
    {/if}
  </aside>
{/if}
