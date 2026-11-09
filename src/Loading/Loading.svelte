<script>
  /**
   * @event {CustomEvent<null>} introstart
   * @event {CustomEvent<null>} introend
   * @event {CustomEvent<null>} outrostart
   * @event {CustomEvent<null>} outroend
   */

  /** Set to `true` to use the small variant */
  export let small = false;

  /** Set to `false` to disable the active state */
  export let active = true;

  /** Set to `false` to disable the overlay */
  export let withOverlay = true;

  /** Specify the description to describe the loading state */
  export let description = "loading";

  /**
   * Wait this many milliseconds after `active` turns `true` before showing
   * the spinner. Once shown, the spinner stays for at least 500 ms, so fast
   * work shows nothing and slow work never flashes. While it waits, the
   * spinner is in the page but hidden, so server HTML already holds it.
   * Set to `0` to show the spinner at once.
   */
  export let delay = 0;

  /**
   * Animate the spinner, and the overlay behind it, as they appear and leave
   * when a parent's `{#if}` adds or removes it. Set to `true` for Carbon's
   * fade, to fade params (e.g., `{ duration: "slow01" }`) to customize it, or
   * to `{ fn }` to use another transition. The spinner does not animate by
   * default.
   * When `undefined`, the nearest `Motion` sets it through the `loading` role.
   * @type {import("../motion/resolve-transition.js").TransitionProp<import("../motion/transitions.js").FadeParams>}
   */
  export let transition = undefined;

  import { onMount } from "svelte";
  import { getMotionDefault } from "../motion/context.js";
  import { resolveTransition } from "../motion/resolve-transition.js";
  import { fade } from "../motion/transitions.js";
  import { createLoadingDelay } from "../utils/delayed-loading.js";
  import LoadingSpinner from "./LoadingSpinner.svelte";
  import { overlayFocus } from "./overlay-focus.js";

  /** @type {{ fn: typeof fade; params: import("../motion/transitions.js").FadeParams }} */
  const fadePreset = { fn: fade, params: { duration: "moderate02" } };

  const motionDefault = getMotionDefault("loading");

  $: ({
    fn: transitionFn,
    params: transitionParams,
    animated,
  } = resolveTransition(transition ?? $motionDefault, fadePreset));

  // `shown` is the spinner the user sees. With a delay, an active spinner
  // first renders `waiting`: in the page but hidden, and CSS reveals it
  // after `delay` even before the script runs. The server HTML, the first
  // client render and a spinner mounted for fast work all start this way,
  // so the page never flashes a spinner and hydration keeps the node.
  let shown = delay > 0 ? false : active;
  // The stop animation plays only for a spinner that has shown.
  let appeared = shown;
  let mounted = false;
  /** @type {import("../utils/delayed-loading.js").LoadingDelay | undefined} */
  let loadingTimer;

  /** @param {number} delay */
  function createTimer(delay) {
    const timer = createLoadingDelay(
      (next) => {
        shown = next;
        if (next) appeared = true;
      },
      { delay, minDuration: delay > 0 ? undefined : 0 },
    );
    // Start from what is on screen, so a new `delay` keeps the spinner.
    timer(shown);
    return timer;
  }

  $: if (mounted) {
    loadingTimer?.cancel();
    loadingTimer = createTimer(delay);
  }
  $: loadingTimer?.(active);

  onMount(() => {
    mounted = true;
    return () => loadingTimer?.cancel();
  });

  $: waiting = active && !shown;
  $: spinning = active || shown;
  $: revealAfter = waiting ? `${delay}ms` : undefined;

  // Svelte 5 makes an element inert while it leaves; Svelte 3 and 4 do not.
  /** @param {Event} event */
  function handleOutroStart(event) {
    /** @type {HTMLElement} */ (event.currentTarget).inert = true;
  }
</script>

{#if delay <= 0 || active || appeared}
  {#if withOverlay && animated}
    <div
      role={spinning ? "dialog" : undefined}
      aria-label={spinning ? description : undefined}
      tabindex="-1"
      class:bx--loading-overlay={true}
      class:bx--loading-overlay--stop={!spinning}
      class:bx--loading-overlay--delayed={waiting}
      style:animation-duration={revealAfter}
      {...$$restProps}
      use:overlayFocus={shown}
      transition:transitionFn|global={transitionParams}
      on:introstart
      on:introend
      on:outrostart
      on:outrostart={handleOutroStart}
      on:outroend
    >
      <div
        class:bx--loading={true}
        class:bx--loading--small={small}
        class:bx--loading--stop={!spinning}
      >
        <LoadingSpinner {small} {description} />
      </div>
    </div>
  {:else if withOverlay}
    <div
      role={spinning ? "dialog" : undefined}
      aria-label={spinning ? description : undefined}
      tabindex="-1"
      class:bx--loading-overlay={true}
      class:bx--loading-overlay--stop={!spinning}
      class:bx--loading-overlay--delayed={waiting}
      style:animation-duration={revealAfter}
      {...$$restProps}
      use:overlayFocus={shown}
    >
      <div
        class:bx--loading={true}
        class:bx--loading--small={small}
        class:bx--loading--stop={!spinning}
      >
        <LoadingSpinner {small} {description} />
      </div>
    </div>
  {:else if animated}
    <div
      class:bx--loading={true}
      class:bx--loading--small={small}
      class:bx--loading--stop={!spinning}
      class:bx--loading--delayed={waiting}
      {...$$restProps}
      transition:transitionFn|global={transitionParams}
      on:introstart
      on:introend
      on:outrostart
      on:outroend
    >
      <LoadingSpinner {small} {description} {revealAfter} />
    </div>
  {:else}
    <div
      class:bx--loading={true}
      class:bx--loading--small={small}
      class:bx--loading--stop={!spinning}
      class:bx--loading--delayed={waiting}
      {...$$restProps}
    >
      <LoadingSpinner {small} {description} {revealAfter} />
    </div>
  {/if}
{/if}
