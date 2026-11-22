<script>
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

  import { onMount } from "svelte";
  import { createLoadingDelay } from "../utils/delayed-loading.js";
  import LoadingSpinner from "./LoadingSpinner.svelte";
  import { overlayFocus } from "./overlay-focus.js";

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
</script>

{#if delay <= 0 || active || appeared}
  {#if withOverlay}
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
      <LoadingSpinner {small} active={spinning} {description} />
    </div>
  {:else}
    <LoadingSpinner
      {...$$restProps}
      {small}
      active={spinning}
      {description}
      {revealAfter}
    />
  {/if}
{/if}
