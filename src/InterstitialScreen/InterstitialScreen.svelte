<script>
  /**
   * @event {{ actionType: "close" | "start" | "skip" | "back" | "next" }} close - Dispatched when the screen is about to close, from the header close button, Escape, or the footer's final Skip/Get Started action. Cancelable: call `preventDefault()` to keep it open.
   */

  /**
   * Set to `true` to open the interstitial screen.
   * @bindable writable
   */
  export let open = false;

  /** Set to `true` to render as a full-screen takeover instead of a modal-hosted dialog */
  export let isFullScreen = false;

  /**
   * Element to return focus to when the screen closes.
   * Defaults to the element that had focus when the screen opened.
   * @bindable writable
   * @type {HTMLElement | undefined}
   */
  export let launcherButtonRef = undefined;

  /** Specify the ARIA label for the top-level element */
  export let ariaLabel = "Interstitial screen";

  /**
   * Obtain a reference to the top-level HTML element.
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, setContext } from "svelte";
  import { writable } from "svelte/store";
  import ComposedModal from "../ComposedModal/ComposedModal.svelte";
  import { dismiss } from "../utils/dismiss.js";
  import { returnFocus } from "../utils/focus.js";

  const dispatch = createEventDispatcher();

  const sharedIsFullScreen = writable(isFullScreen);
  $: sharedIsFullScreen.set(isFullScreen);

  /**
   * @type {import("svelte/store").Writable<number>}
   */
  const progStep = writable(0);
  /**
   * @type {import("svelte/store").Writable<ReadonlyArray<{ id: string; stepTitle: string }>>}
   */
  const views = writable([]);

  // Unlike `ProgressIndicator`'s batched registration, this stays synchronous:
  // Header/Footer key their initial button set and progress display off
  // `$views.length` during the very first render, before anything can `await
  // tick()` to observe a deferred flush.
  /**
   * @type {(view: { id: string; stepTitle: string }) => void}
   */
  function addView(view) {
    views.update((_) => {
      const index = _.findIndex((_view) => _view.id === view.id);
      if (index !== -1) {
        return _.map((_view, i) =>
          i === index ? { ..._view, ...view } : _view,
        );
      }
      return [..._, view];
    });
  }

  /**
   * @type {(id: string) => void}
   */
  function removeView(id) {
    views.update((_) => _.filter((view) => view.id !== id));
  }

  /**
   * @type {(index: number) => void}
   */
  function handleGotoStep(index) {
    progStep.set(Math.max(0, Math.min(index, $views.length - 1)));
  }

  /**
   * @type {(actionType: "close" | "start" | "skip" | "back" | "next") => void}
   */
  function handleClose(actionType) {
    const shouldContinue = dispatch(
      "close",
      { actionType },
      { cancelable: true },
    );
    if (!shouldContinue) return;

    open = false;
    progStep.set(0);
  }

  /** @type {HTMLElement | null} */
  let openerFocus = null;
  let wasOpen = false;

  // Closing unmounts the screen and its focused button, so focus would fall
  // to <body>. Return it to `launcherButtonRef`, else to whatever had focus
  // when the screen opened, unless a close handler already moved it. Also
  // covers a consumer setting `open` to false directly.
  $: syncFocusReturn(open);

  /** @type {(isOpen: boolean) => void} */
  function syncFocusReturn(isOpen) {
    if (isOpen && !wasOpen) {
      openerFocus =
        typeof document !== "undefined" &&
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    } else if (!isOpen && wasOpen) {
      const target = launcherButtonRef ?? openerFocus;
      const region = ref;
      openerFocus = null;
      setTimeout(() => returnFocus(target, region), 0);
    }
    wasOpen = isOpen;
  }

  setContext("carbon:InterstitialScreen", {
    isFullScreen: sharedIsFullScreen,
    progStep,
    views,
    addView,
    removeView,
    handleGotoStep,
    handleClose,
  });

  // A full-screen takeover has no ComposedModal to own Escape (modal-hosted
  // mode already gets this from ComposedModal's own handler); this listener
  // only ever runs for the full-screen case.
  function handleWindowKeydown(event) {
    if (event.key === "Escape") {
      handleClose("close");
    }
  }
</script>

{#if open}
  {#if isFullScreen}
    <div
      bind:this={ref}
      use:dismiss={{
        enabled: true,
        listeners: [{ type: "keydown", handler: handleWindowKeydown }],
      }}
      role="main"
      aria-label={ariaLabel}
      class:bx--interstitial-screen={true}
      class:bx--interstitial-screen--full-screen={true}
      {...$$restProps}
    >
      <div class:bx--interstitial-screen__container={true}>
        <slot />
      </div>
    </div>
  {:else}
    <ComposedModal
      bind:ref
      bind:open
      size="lg"
      preventCloseOnClickOutside
      containerClass="bx--interstitial-screen"
      aria-label={ariaLabel}
      {...$$restProps}
      on:close={(event) => {
        event.preventDefault();
        handleClose("close");
      }}
    >
      <slot />
    </ComposedModal>
  {/if}
{/if}
