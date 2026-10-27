<script>
  /**
   * @event close
   * @property {"escape-key" | "outside-click" | "close-button" | "programmatic"} trigger
   * @event {null} open
   * @event transitionend
   * @property {boolean} open
   * @restProps {div}
   * @slot {{}}
   * @slot {{}} actions - Footer buttons. The tearsheet lays them out in an `ActionSet`.
   * @slot {{}} headerActions - Buttons in the header, beside the title. Wide only.
   * @slot {{}} influencer - A rail beside the body for context, such as a step list. Wide only.
   * @slot {{}} decorator - An `AILabel`, beside the close button.
   * @slot {{}} descriptionChildren - Rich description content. Overrides `description`.
   */

  /**
   * Set to `true` to open the tearsheet.
   * @bindable writable
   */
  export let open = false;

  /**
   * Set the width. A wide tearsheet spans the window with a margin on
   * each side. A narrow one is a single column, as wide as a small modal,
   * and has no `headerActions` or `influencer`.
   * @type {"narrow" | "wide"}
   */
  export let size = "wide";

  /**
   * Specify the title. It names the tearsheet.
   * @type {string | undefined}
   */
  export let title = undefined;

  /**
   * Specify a label above the title. Renders only with a `title`.
   * @type {string | undefined}
   */
  export let label = undefined;

  /**
   * Specify the description. It describes the tearsheet.
   * @type {string | undefined}
   */
  export let description = undefined;

  /**
   * Set the side the `influencer` rail sits on. `"start"` is the left in a
   * left-to-right layout and the right in a right-to-left one. Also
   * accepts Carbon React's `"left"` and `"right"`, which map to `"start"`
   * and `"end"`.
   * @type {"start" | "end" | "left" | "right"}
   */
  export let influencerPosition = "start";

  /**
   * Set the width of the `influencer` rail: 256px or 320px.
   * @type {"narrow" | "wide"}
   */
  export let influencerWidth = "narrow";

  /**
   * Control whether the header shows a close button. By default a
   * tearsheet shows one when it has no `actions`, as in Carbon React.
   * Set to `true` to hide it, or `false` to always show it.
   * @type {boolean | undefined}
   */
  export let hideCloseButton = undefined;

  /** Specify the close button's accessible name */
  export let closeIconDescription = "Close";

  /**
   * Control whether clicking outside the tearsheet closes it.
   * By default, a tearsheet without `actions` closes and a tearsheet with
   * `actions` stays open, as modals do in Carbon v11.
   * Set to `true` to always keep the tearsheet open, or `false` to always
   * close it.
   * @type {boolean | undefined}
   */
  export let preventCloseOnClickOutside = undefined;

  /**
   * Specify a selector for the element to focus when the tearsheet opens.
   * Without a match, focus goes to the first form field, then the close
   * button. Set to `null` to leave focus where it is.
   * @type {null | string}
   */
  export let selectorPrimaryFocus = "[data-modal-primary-focus]";

  /**
   * Set an id for the dialog.
   * The title and description ids derive from it as `{id}-title` and
   * `{id}-description`.
   */
  export let id = uniqueId();

  /**
   * Obtain a reference to the dialog element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import {
    createEventDispatcher,
    getContext,
    onMount,
    setContext,
    tick,
  } from "svelte";
  import { readable, readonly, writable } from "svelte/store";
  import Decorator from "../AILabel/Decorator.svelte";
  import ActionSet from "../ActionSet/ActionSet.svelte";
  import Button from "../Button/Button.svelte";
  import Heading from "../Heading/Heading.svelte";
  import Section from "../Heading/Section.svelte";
  import { trackModal } from "../Modal/modal-store.js";
  import {
    LAYER_CONTEXT_KEY,
    MODAL_CONTEXT_KEY,
  } from "../constants/context-keys.js";
  import Close from "../icons/Close.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { createDialogLifecycle } from "../utils/dialog-lifecycle.js";
  import { joinDescribedBy } from "../utils/field-status.js";
  import { focusQuietly, initialFocus, restoreFocus } from "../utils/focus.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { noop } from "../utils/noop.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { trapFocus } from "../utils/trap-focus.js";
  import { uniqueId } from "../utils/unique-id.js";
  import {
    joinStack,
    leaveStack,
    stackPosition,
    tearsheetStack,
  } from "./tearsheet-stack.js";

  const dispatch = createEventDispatcher();
  const focusReturn = restoreFocus();

  /** @type {null | HTMLAnchorElement | HTMLButtonElement} */
  let closeButtonRef = null;
  /** @type {null | HTMLDivElement} */
  let mainRef = null;

  const lifecycle = createDialogLifecycle({
    dispatch,
    setOpen: (value) => {
      open = value;
    },
    preventCloseOnClickOutside: () => preventCloseOnClickOutside,
    passive: () => !$$slots.actions,
    saveFocusReturn: focusReturn.save,
    restoreFocusReturn: () => focusReturn.restore(ref),
    getContainer: () => ref,
    focus: () => focus(),
    getOpen: () => open,
  });
  const { close, outsideDismiss } = lifecycle;

  // Menus and tooltips inside portal out of the scrolling body, as in a
  // modal.
  setContext(MODAL_CONTEXT_KEY, {});

  // The wide body is the page surface, so its fields sit at level 0 and a
  // `Layer` inside steps up to 1. The narrow body is one level up, on the
  // tearsheet's own surface, as a modal's body is.
  /** @type {import("svelte/store").Writable<1 | 2>} */
  const layerLevel = writable(1);
  $: layerLevel.set(narrow ? 2 : 1);
  setContext(LAYER_CONTEXT_KEY, readonly(layerLevel));

  // The title is one level below the enclosing `Section`, or an `h2`, and
  // the content below it starts one level further down.
  const parentSection = getContext("carbon:Section") ?? readable(1);

  /**
   * Starts active for a filled slot, so the server renders the AI surface.
   * `Decorator` clears it when no `AILabel` claims the slot.
   * @type {import("svelte/store").Writable<undefined | "active" | "revert">}
   */
  const aiLabelState = writable($$slots.decorator ? "active" : undefined);

  function focus() {
    if (!ref) return;
    const target = initialFocus({
      container: ref,
      selectorPrimaryFocus,
      fallbacks: [closeButtonRef, ref],
    });
    // The user didn't ask for a tooltip on the first focus target, so one
    // Escape still closes the tearsheet.
    if (target) focusQuietly(target);
  }

  /**
   * @param {number} level
   * @returns {1 | 2 | 3 | 4 | 5 | 6}
   */
  function clampLevel(level) {
    return /** @type {1 | 2 | 3 | 4 | 5 | 6} */ (Math.min(level, 6));
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (!open || !ref) return;
    if (event.key === "Escape") {
      // Escape that cancels an IME composition is not a close, and a
      // control inside may already have used this one.
      if (isImeComposition(event) || event.defaultPrevented) return;
      // A tearsheet nested in this one closes on its own.
      event.stopPropagation();
      close("escape-key");
    } else if (event.key === "Tab" && !event.defaultPrevented) {
      trapFocus({ container: ref, event });
    }
  }

  /** @param {TransitionEvent} event */
  function handleTransitionend(event) {
    // Only the container's slide ends the exit. A control inside can
    // transition its own `transform`, and that event bubbles up here.
    if (event.target !== ref || event.propertyName !== "transform") return;
    dispatch("transitionend", { open });
    if (!open) focusReturn.restore(ref);
  }

  // The body scrolls. Once it overflows it takes a tab stop, so a
  // keyboard user can scroll it, and a name. Observing the container and
  // the content catches a window resize and content that grows.
  let scrollable = false;
  let stopObserving = noop;

  function measureOverflow() {
    scrollable = mainRef
      ? mainRef.scrollHeight - mainRef.clientHeight > 1
      : false;
  }

  /** @param {null | HTMLDivElement} main */
  function observeOverflow(main) {
    stopObserving();
    const content = main?.firstElementChild;
    if (!main || !content) {
      stopObserving = noop;
      return;
    }
    const stopMain = observeResize(main, measureOverflow);
    const stopContent = observeResize(content, measureOverflow);
    stopObserving = () => {
      stopMain();
      stopContent();
    };
  }

  // Open tearsheets stack, whichever way they are placed in the markup.
  // The stack is only written after mount, so the server renders each one
  // as the top of its own stack.
  const stackKey = Symbol("tearsheet");
  let position = stackPosition([], stackKey);
  let mounted = false;

  /**
   * @param {boolean} ready
   * @param {boolean} nextOpen
   */
  function syncStack(ready, nextOpen) {
    if (!ready) return;
    if (nextOpen) joinStack(stackKey);
    else leaveStack(stackKey);
  }

  const sharedOpen = writable(open);
  $: $sharedOpen = open;
  trackModal(sharedOpen);

  // Below `md` a wide tearsheet's 80px footer buttons would take a quarter
  // of a narrow window each and break their labels, so the footer uses the
  // narrow tearsheet's. Set after mount, as the server can't know the width.
  let compact = false;

  onMount(() => {
    mounted = true;
    lifecycle.setMounted();
    const unsubscribe = tearsheetStack.subscribe((list) => {
      position = stackPosition(list, stackKey);
    });
    if (open) {
      tick().then(() => {
        if (open) focus();
      });
    }
    const query = window.matchMedia("(max-width: 671px)");
    compact = query.matches;
    /** @param {MediaQueryListEvent} event */
    const handleChange = (event) => {
      compact = event.matches;
    };
    query.addEventListener("change", handleChange);
    return () => {
      stopObserving();
      query.removeEventListener("change", handleChange);
      unsubscribe();
      leaveStack(stackKey);
    };
  });

  $: lifecycle.syncOpen(open);
  $: syncStack(mounted, open);
  $: observeOverflow(mainRef);

  // Closed content is built on the first open and kept after that.
  let openedOnce = open;
  $: if (open) openedOnce = true;

  $: behind = open && position.level > 0;
  $: narrow = size === "narrow";
  $: titleId = `${id}-title`;
  $: descriptionId = `${id}-description`;
  $: hasDescription = Boolean(description) || $$slots.descriptionChildren;
  $: showHeaderActions = $$slots.headerActions && !narrow;
  $: showInfluencer = $$slots.influencer && !narrow;
  $: influencerEnd =
    influencerPosition === "end" || influencerPosition === "right";
  $: influencerClass = [
    "bx--tearsheet__influencer",
    influencerEnd
      ? "bx--tearsheet__influencer--end"
      : "bx--tearsheet__influencer--start",
    influencerWidth === "wide" && "bx--tearsheet__influencer--wide",
  ]
    .filter(Boolean)
    .join(" ");
  $: showClose =
    hideCloseButton === undefined ? !$$slots.actions : !hideCloseButton;
  $: hasHeader =
    Boolean(title) ||
    hasDescription ||
    showHeaderActions ||
    showClose ||
    $$slots.decorator;
  $: titleLevel = clampLevel($parentSection + 1);
  $: contentLevel = clampLevel(titleLevel + 1);
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: containerProps,
  } = splitAriaNaming($$restProps));

  const warnedSlots = new Set();

  /**
   * @param {string} name
   * @param {boolean} filled
   */
  function warnNarrowSlot(name, filled) {
    if (!filled || warnedSlots.has(name)) return;
    warnedSlots.add(name);
    console.warn(
      `[Tearsheet.svelte] the \`${name}\` slot needs \`size="wide"\`; a narrow tearsheet does not render it.`,
    );
  }

  $: warnNarrowSlot("headerActions", narrow && $$slots.headerActions);
  $: warnNarrowSlot("influencer", narrow && $$slots.influencer);
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<div
  role="presentation"
  class:bx--tearsheet={true}
  class:bx--layer-one={true}
  class:is-visible={open}
  class:bx--tearsheet--wide={!narrow}
  class:bx--tearsheet--narrow={narrow}
  class:bx--tearsheet--stacked={open && position.stacked}
  class:bx--tearsheet--behind-1={behind && position.level === 1}
  class:bx--tearsheet--behind-2={behind && position.level === 2}
  class:bx--tearsheet--decorator={$$slots.decorator}
  class:bx--tearsheet--ai-label={$aiLabelState === "active"}
  inert={open && !behind ? undefined : true}
  on:keydown
  on:keydown={handleKeydown}
  on:mousedown={(event) => {
    if (event.target === event.currentTarget) outsideDismiss.pressOutside();
  }}
  on:mouseup={outsideDismiss.release}
  on:transitionend={handleTransitionend}
>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div
    bind:this={ref}
    {id}
    role="dialog"
    aria-modal="true"
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy ??
      (ariaLabel === undefined && title ? titleId : undefined)}
    aria-describedby={joinDescribedBy(
      hasDescription ? descriptionId : undefined,
      ariaDescribedBy,
    )}
    tabindex="-1"
    class:bx--tearsheet__container={true}
    {...containerProps}
    on:click
    on:mousedown={outsideDismiss.pressInside}
  >
    {#if hasHeader}
      <div
        class:bx--tearsheet__header={true}
        class:bx--tearsheet__header--close={showClose}
        class:bx--tearsheet__header--decorator={$$slots.decorator}
      >
        <Section
          tag="div"
          level={titleLevel}
          class="bx--tearsheet__header-content"
        >
          <div class:bx--tearsheet__header-fields={true}>
            {#if title && label}
              <p class:bx--tearsheet__label={true}>{label}</p>
            {/if}
            {#if title}
              <Heading id={titleId} class="bx--tearsheet__title"
                >{title}</Heading
              >
            {/if}
            {#if hasDescription}
              <div id={descriptionId} class:bx--tearsheet__description={true}>
                <slot name="descriptionChildren">{description}</slot>
              </div>
            {/if}
          </div>
          {#if showHeaderActions}
            <div class:bx--tearsheet__header-actions={true}>
              <slot name="headerActions" />
            </div>
          {/if}
        </Section>
        {#if $$slots.decorator || showClose}
          <div class:bx--tearsheet__corner={true}>
            {#if $$slots.decorator}
              <Decorator
                class="bx--tearsheet__decorator"
                state={aiLabelState}
                labelSize="xs"
              >
                <slot name="decorator" />
              </Decorator>
            {/if}
            {#if showClose}
              <Button
                bind:ref={closeButtonRef}
                kind="ghost"
                size="field"
                icon={Close}
                iconDescription={closeIconDescription}
                tooltipPosition="bottom"
                tooltipAlignment="end"
                class="bx--tearsheet__close"
                on:click={() => close("close-button")}
              />
            {/if}
          </div>
        {/if}
      </div>
    {/if}
    <div class:bx--tearsheet__body={true}>
      {#if showInfluencer && !influencerEnd}
        <Section tag="div" level={contentLevel} class={influencerClass}>
          <div class:bx--layer-two={true}>
            {#if openedOnce}
              <slot name="influencer" />
            {/if}
          </div>
        </Section>
      {/if}
      <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
      <div
        bind:this={mainRef}
        class:bx--tearsheet__main={true}
        class:bx--layer-two={narrow}
        role={scrollable && title ? "region" : undefined}
        aria-labelledby={scrollable && title ? titleId : undefined}
        tabindex={scrollable ? 0 : undefined}
      >
        <Section tag="div" level={contentLevel} class="bx--tearsheet__content">
          {#if openedOnce}
            <slot />
          {/if}
        </Section>
      </div>
      {#if showInfluencer && influencerEnd}
        <Section tag="div" level={contentLevel} class={influencerClass}>
          <div class:bx--layer-two={true}>
            {#if openedOnce}
              <slot name="influencer" />
            {/if}
          </div>
        </Section>
      {/if}
    </div>
    {#if $$slots.actions}
      <ActionSet
        size={narrow || compact ? "lg" : "2xl"}
        class="bx--tearsheet__actions"
      >
        <slot name="actions" />
      </ActionSet>
    {/if}
  </div>
</div>
