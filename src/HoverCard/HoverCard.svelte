<script>
  /**
   * An interactive card that opens when the pointer rests on a trigger or
   * keyboard focus reaches it. Use it for supplementary detail: a person, an
   * issue, a link preview. The same information must stay reachable another
   * way, because there is no hover on touch screens, where the card never
   * opens and the trigger behaves as it would without one.
   *
   * Put a focusable element in the `trigger` slot, such as a link or a
   * button. It keeps its own role. Use `Toggletip` for content that opens on
   * a click, and `Tooltip` for a text label with nothing to interact with.
   *
   * @restProps {span}
   * @event {null} open
   * @event {null} close
   * @slot {{ data: any }} - The card's content. With `load`, it renders once the data arrives.
   * @slot {{}} trigger - The element that opens the card.
   * @slot {{}} loading - Shown while `load` is pending. Defaults to a skeleton.
   * @slot {{ error: unknown, retry: () => void }} error - Shown when `load` rejects.
   */

  /**
   * Set to `true` to open the card.
   * The pointer and keyboard focus set it too.
   * @bindable writable
   */
  export let open = false;

  /**
   * Set the card's side of the trigger.
   * @type {"top" | "right" | "bottom" | "left"}
   */
  export let direction = "bottom";

  /**
   * Set the card's alignment along the trigger.
   * Above and below, `start` and `end` name inline sides, so they swap
   * under `dir="rtl"`.
   * @type {"start" | "center" | "end"}
   */
  export let align = "start";

  /**
   * Set the width of the card.
   * @type {"sm" | "md" | "lg"}
   */
  export let size = "md";

  /**
   * Specify the time in milliseconds the pointer rests on the trigger before
   * the card opens.
   */
  export let openDelay = HOVER_CARD_OPEN_DELAY_MS;

  /**
   * Specify the time in milliseconds the card stays open after the pointer
   * or focus leaves, so the pointer can cross to it. A pointer that keeps
   * moving toward the card holds it open past this time.
   */
  export let closeDelay = HOVER_CARD_CLOSE_DELAY_MS;

  /**
   * Set to `true` to keep the card from opening.
   * An open card closes.
   */
  export let disabled = false;

  /**
   * Fetch the card's data when it opens. The function receives an
   * `AbortSignal`, aborted when the card closes before the data arrives.
   * Without a `cacheKey` the result is kept for `cacheMs` by this card.
   * @type {((context: { signal: AbortSignal }) => Promise<any>) | undefined}
   */
  export let load = undefined;

  /**
   * Share the result of `load` between every card with the same key, such as
   * the same person mentioned in a list. Change it to fetch again.
   * @type {string | undefined}
   */
  export let cacheKey = undefined;

  /**
   * Specify how long in milliseconds the result of `load` is reused. Set to
   * `0` to fetch on every open.
   */
  export let cacheMs = 60_000;

  /** Specify the text shown when `load` rejects. */
  export let errorText = "Unable to load.";

  /** Specify the label of the retry button shown when `load` rejects. */
  export let retryText = "Retry";

  /**
   * Set to `true` to always render the card in a portal, or `false` to keep
   * it in place. Left unset, it moves to a portal when a box around it
   * (`overflow` other than `visible`) would cut it off.
   * @type {boolean | undefined}
   */
  export let portalCard = undefined;

  /**
   * Specify a class for the card's popover.
   * The class is also applied when the card is portalled.
   * @type {string | undefined}
   */
  export let popoverClass = undefined;

  /**
   * Set an id for the element that wraps the trigger.
   * The card's id derives from it as `{id}-card`.
   */
  export let id = uniqueId();

  /**
   * Obtain a reference to the card, the element with `role="dialog"`.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { createEventDispatcher, onMount } from "svelte";
  import Button from "../Button/Button.svelte";
  import Popover from "../Popover/Popover.svelte";
  import SkeletonText from "../SkeletonText/SkeletonText.svelte";
  import {
    HOVER_CARD_CLOSE_DELAY_MS,
    HOVER_CARD_FOCUS_DELAY_MS,
    HOVER_CARD_OPEN_DELAY_MS,
    SUBMENU_AIM_PAUSE_MS,
  } from "../constants/timing.js";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { dismiss } from "../utils/dismiss.js";
  import { createOpenCloseDispatcher } from "../utils/dispatch-open-close.js";
  import { isQuietFocus, returnFocusOnClose } from "../utils/focus.js";
  import {
    claimHoverCard,
    hoverCardResults,
    isFocusVisible,
    releaseHoverCard,
  } from "../utils/hover-card.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { isAimingAtFloating } from "../utils/pointer-aim.js";
  import { createSubmenuHoverIntent } from "../utils/submenu-hover-intent.js";
  import { selectorTabbable } from "../utils/trap-focus.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  const notifyOpenChange = createOpenCloseDispatcher(dispatch);

  /** @type {null | HTMLSpanElement} */
  let wrapperRef = null;
  /** @type {null | HTMLSpanElement} */
  let triggerRef = null;

  // The pointer is over the trigger or the card, and keyboard focus is
  // within either. The card stays open while one holds.
  let hovered = false;
  let focused = false;
  // Escape or a click closed the card: it stays closed until the pointer
  // and focus have both left the trigger and come back.
  let dismissed = false;

  $: cardId = `${id}-card`;
  $: triggerId = `${id}-trigger`;
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: wrapperProps,
  } = splitAriaNaming($$restProps));

  // The placement as Toggletip names it: `bottom-start`, or `bottom` for
  // center.
  /** @type {import("../Popover/Popover.svelte").PopoverProps["align"]} */
  $: popoverAlign =
    align === "center"
      ? direction
      : /** @type {`${typeof direction}-${typeof align}`} */ (
          `${direction}-${align}`
        );

  function show() {
    if (disabled || dismissed || open) return;
    open = true;
  }

  function hide() {
    if (hovered || focused || !open) return;
    open = false;
  }

  // Closes at once, whatever holds the card open: another card took the
  // slot, or the user asked, with Escape or a click.
  function close() {
    intent.cancel();
    open = false;
  }

  function dismissCard() {
    dismissed = true;
    close();
  }

  function settle() {
    if (!hovered && !focused) dismissed = false;
  }

  const card = { close };

  const intent = createSubmenuHoverIntent((next) => (next ? show() : hide()), {
    get openDelay() {
      return openDelay;
    },
    get closeDelay() {
      return closeDelay;
    },
    aimPause: SUBMENU_AIM_PAUSE_MS,
    // The pointer that leaves the trigger toward the card keeps it open.
    getSubmenu: () => ref,
    isAiming: (point, from, rect) =>
      isAimingAtFloating(
        point,
        from,
        rect,
        (triggerRef ?? wrapperRef)?.getBoundingClientRect() ?? rect,
      ),
  });

  /** @param {PointerEvent} event */
  function handlePointerEnter(event) {
    // Touch has no hover: the trigger acts as it would without a card. An
    // in-place card is inside the wrapper, which already tracks the pointer.
    if (event.pointerType === "touch" || isInPlaceCard(event)) return;
    hovered = true;
    intent.cancelClose();
    if (!open) intent.scheduleOpen();
  }

  /** @param {PointerEvent} event */
  function handlePointerLeave(event) {
    if (event.pointerType === "touch" || isInPlaceCard(event)) return;
    hovered = false;
    settle();
    intent.scheduleClose(event);
  }

  /** @param {Event} event */
  function isInPlaceCard(event) {
    return event.currentTarget === ref && !!wrapperRef?.contains(ref);
  }

  /** @param {FocusEvent} event */
  function handleFocusin(event) {
    const target = /** @type {HTMLElement} */ (event.target);
    if (isQuietFocus(target)) return;
    const movedWithin = isInside(
      /** @type {Node | null} */ (event.relatedTarget),
    );
    if (!isFocusVisible(target)) {
      if (movedWithin) intent.cancelClose();
      return;
    }
    focused = true;
    dismissed = movedWithin && dismissed;
    intent.cancelClose();
    if (!open && !movedWithin) intent.scheduleOpen(HOVER_CARD_FOCUS_DELAY_MS);
  }

  /** @param {FocusEvent} event */
  function handleFocusout(event) {
    // Focus moving between the trigger and the card keeps the card open. A
    // `null` target is a click on something that cannot take focus.
    if (isInside(/** @type {Node | null} */ (event.relatedTarget))) return;
    if (!focused) return;
    focused = false;
    settle();
    intent.scheduleClose();
  }

  /** @param {Node | null} node */
  function isInside(node) {
    return !!node && (!!wrapperRef?.contains(node) || !!ref?.contains(node));
  }

  function triggerTarget() {
    return /** @type {HTMLElement | null} */ (
      triggerRef?.querySelector(selectorTabbable) ?? null
    );
  }

  /** @param {HTMLElement} root */
  function tabbables(root) {
    return /** @type {HTMLElement[]} */ (
      Array.from(root.querySelectorAll(selectorTabbable))
    );
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (!open) return;
    if (event.key === "Escape") {
      // Escape that cancels an IME composition is not a close.
      if (isImeComposition(event)) return;
      event.stopPropagation();
      dismissCard();
      return;
    }
    if (event.key !== "Tab" || !ref || !wrapperRef) return;
    // In place, the card follows the trigger in the tab order, so Tab and
    // Shift+Tab already move between them. A portal is elsewhere in the
    // document, so the keys are routed by hand.
    if (wrapperRef.contains(ref)) return;
    const target = /** @type {Node} */ (event.target);
    const items = tabbables(ref);
    const trigger = triggerTarget();
    if (!items.length || !trigger) return;
    if (ref.contains(target)) {
      if (event.shiftKey && target === items[0]) {
        event.preventDefault();
        trigger.focus();
      } else if (!event.shiftKey && target === items[items.length - 1]) {
        // Focus the trigger and let Tab carry on from there, past it.
        trigger.focus();
      }
    } else if (!event.shiftKey && triggerRef?.contains(target)) {
      event.preventDefault();
      items[0].focus();
    }
  }

  // A click on the trigger acts on it, so the card steps aside.
  function handleTriggerClick() {
    intent.cancel();
    if (open) dismissCard();
  }

  // Escape works with focus elsewhere, for a card the pointer opened.
  /** @param {Event} event */
  function handleWindowKeydown(event) {
    if (/** @type {KeyboardEvent} */ (event).key !== "Escape") return;
    if (isImeComposition(/** @type {KeyboardEvent} */ (event))) return;
    if (open) dismissCard();
  }

  $: if (disabled && open) close();

  // One card at a time, page-wide. Opening closes the card that was open.
  $: if (open) {
    claimHoverCard(card);
  } else {
    releaseHoverCard(card);
    hovered = false;
    focused = false;
  }
  $: notifyOpenChange(open);

  const restoreFocus = returnFocusOnClose(
    () => triggerTarget(),
    () => ref,
  );
  $: restoreFocus(open);

  // The trigger keeps its own role. While the card is open, it points to the
  // card as its details. Unlike `aria-describedby`, that keeps the card's
  // links and buttons as structure. Unlike `aria-expanded` or
  // `aria-haspopup`, it does not promise that activating the trigger
  // toggles the card.
  /**
   * @param {boolean} isOpen
   * @param {string} detailsId
   * @param {HTMLElement | null} root
   */
  function syncDetails(isOpen, detailsId, root) {
    const target = root?.querySelector(selectorTabbable);
    if (!target) return;
    if (isOpen) target.setAttribute("aria-details", detailsId);
    else if (target.getAttribute("aria-details") === detailsId)
      target.removeAttribute("aria-details");
  }
  $: syncDetails(open, cardId, triggerRef);

  /** @type {"idle" | "loading" | "loaded" | "error"} */
  let status = "idle";
  /** @type {any} */
  let data;
  /** @type {unknown} */
  let error;
  /** @type {null | AbortController} */
  let controller = null;
  let runs = 0;
  // This card's own result, when there is no `cacheKey`.
  /** @type {null | { data: any, at: number }} */
  let ownResult = null;
  /** @type {string | undefined} */
  let ownKey;

  function readResult() {
    const hit =
      cacheKey === undefined ? ownResult : hoverCardResults.get(cacheKey);
    return hit && Date.now() - hit.at < cacheMs ? hit : null;
  }

  function startLoad() {
    if (!load) return;
    if (cacheKey !== ownKey) {
      ownKey = cacheKey;
      ownResult = null;
    }
    const hit = readResult();
    if (hit) {
      data = hit.data;
      status = "loaded";
      return;
    }
    const run = ++runs;
    const key = cacheKey;
    const request = load;
    controller = new AbortController();
    const { signal } = controller;
    status = "loading";
    error = undefined;
    Promise.resolve()
      .then(() => request({ signal }))
      .then(
        (result) => {
          if (run !== runs) return;
          const entry = { data: result, at: Date.now() };
          if (key === undefined) ownResult = entry;
          else hoverCardResults.set(key, entry);
          data = result;
          status = "loaded";
        },
        (reason) => {
          if (run !== runs || signal.aborted) return;
          error = reason;
          status = "error";
        },
      );
  }

  function stopLoad() {
    if (status === "loading") {
      runs++;
      controller?.abort();
      status = "idle";
    }
    controller = null;
  }

  /** @param {boolean} isOpen */
  function syncLoad(isOpen) {
    if (isOpen) startLoad();
    else stopLoad();
  }
  $: syncLoad(open);

  onMount(() => {
    return () => {
      intent.cancel();
      releaseHoverCard(card);
      stopLoad();
    };
  });
</script>

<!-- The wrapper is the card's anchor. An in-place card sits inside it, so the
pointer's path from the trigger to the card stays within it. -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<span
  bind:this={wrapperRef}
  {id}
  class:bx--hover-card={true}
  on:pointerenter={handlePointerEnter}
  on:pointerleave={handlePointerLeave}
  on:focusin={handleFocusin}
  on:focusout={handleFocusout}
  on:keydown={handleKeydown}
  use:dismiss={{
    enabled: open,
    listeners: [{ type: "keydown", handler: handleWindowKeydown }],
  }}
  {...wrapperProps}
>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <span
    bind:this={triggerRef}
    id={triggerId}
    class:bx--hover-card__trigger={true}
    on:click={handleTriggerClick}
  >
    <slot name="trigger" />
  </span>
  {#if open}
    <Popover
      {open}
      align={popoverAlign}
      portalPopover={portalCard}
      id={cardId}
      border
      class={["bx--hover-card-popover", popoverClass].filter(Boolean).join(" ")}
    >
      <!-- A portalled card is outside the wrapper's listeners. -->
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <div
        bind:this={ref}
        role="dialog"
        tabindex="-1"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel ? undefined : (ariaLabelledBy ?? triggerId)}
        aria-describedby={ariaDescribedBy}
        aria-busy={status === "loading" ? "true" : undefined}
        class:bx--hover-card__content={true}
        class:bx--hover-card__content--sm={size === "sm"}
        class:bx--hover-card__content--lg={size === "lg"}
        on:pointerenter={handlePointerEnter}
        on:pointerleave={handlePointerLeave}
        on:focusin={handleFocusin}
        on:focusout={handleFocusout}
        on:keydown={handleKeydown}
      >
        {#if !load || status === "loaded"}
          <slot {data} />
        {:else if status === "error"}
          <slot name="error" {error} retry={startLoad}>
            <p class:bx--hover-card__error={true}>{errorText}</p>
            <Button kind="ghost" size="sm" on:click={startLoad}
              >{retryText}</Button
            >
          </slot>
        {:else}
          <slot name="loading"><SkeletonText paragraph /></slot>
        {/if}
      </div>
    </Popover>
  {/if}
</span>
