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
   * Specify the delay (ms) before the spinner renders while `active`.
   * Requests that finish within the delay never show a spinner.
   */
  export let delay = 0;

  /**
   * Animate the spinner, and the overlay behind it, as they appear and leave,
   * when a parent's `{#if}` adds or removes it or `delay` shows it. Set to
   * `true` for Carbon's fade, to fade params (e.g., `{ duration: "slow01" }`)
   * to customize it, or to `{ fn }` to use another transition. The spinner
   * does not animate by default.
   * @type {import("../motion/resolve-transition.js").TransitionProp<import("../motion/transitions.js").FadeParams>}
   */
  export let transition = undefined;

  import { onMount } from "svelte";
  import { resolveTransition } from "../motion/resolve-transition.js";
  import { fade } from "../motion/transitions.js";
  import { createDelayedSetter } from "../utils/delayed-setter.js";
  import LoadingSpinner from "./LoadingSpinner.svelte";
  import { overlayFocus } from "./overlay-focus.js";

  const schedule = createDelayedSetter();
  /** @type {{ fn: typeof fade; params: import("../motion/transitions.js").FadeParams }} */
  const fadePreset = { fn: fade, params: { duration: "moderate02" } };

  // `delay > 0` renders nothing during SSR since the timer only fires client-side.
  let visible = false;

  $: ({
    fn: transitionFn,
    params: transitionParams,
    animated,
  } = resolveTransition(transition, fadePreset));

  $: if (active) {
    schedule(delay, () => {
      visible = true;
    });
  } else {
    schedule.cancel();
    if (delay <= 0) {
      visible = true;
    }
  }

  onMount(() => () => schedule.cancel());

  // Svelte 5 makes an element inert while it leaves; Svelte 3 and 4 do not.
  /** @param {Event} event */
  function handleOutroStart(event) {
    /** @type {HTMLElement} */ (event.currentTarget).inert = true;
  }
</script>

{#if visible && withOverlay && animated}
  <div
    role={active ? "dialog" : undefined}
    aria-label={active ? description : undefined}
    tabindex="-1"
    class:bx--loading-overlay={true}
    class:bx--loading-overlay--stop={!active}
    {...$$restProps}
    use:overlayFocus={active}
    transition:transitionFn|global={transitionParams}
    on:introstart
    on:introend
    on:outrostart
    on:outrostart={handleOutroStart}
    on:outroend
  >
    <div
      aria-atomic="true"
      aria-live={active ? "assertive" : "off"}
      class:bx--loading={true}
      class:bx--loading--small={small}
      class:bx--loading--stop={!active}
    >
      <LoadingSpinner {small} {description} />
    </div>
  </div>
{:else if visible && withOverlay}
  <div
    role={active ? "dialog" : undefined}
    aria-label={active ? description : undefined}
    tabindex="-1"
    class:bx--loading-overlay={true}
    class:bx--loading-overlay--stop={!active}
    {...$$restProps}
    use:overlayFocus={active}
  >
    <div
      aria-atomic="true"
      aria-live={active ? "assertive" : "off"}
      class:bx--loading={true}
      class:bx--loading--small={small}
      class:bx--loading--stop={!active}
    >
      <LoadingSpinner {small} {description} />
    </div>
  </div>
{:else if visible && animated}
  <div
    aria-atomic="true"
    aria-live={active ? "assertive" : "off"}
    class:bx--loading={true}
    class:bx--loading--small={small}
    class:bx--loading--stop={!active}
    {...$$restProps}
    transition:transitionFn|global={transitionParams}
    on:introstart
    on:introend
    on:outrostart
    on:outroend
  >
    <LoadingSpinner {small} {description} />
  </div>
{:else if visible}
  <div
    aria-atomic="true"
    aria-live={active ? "assertive" : "off"}
    class:bx--loading={true}
    class:bx--loading--small={small}
    class:bx--loading--stop={!active}
    {...$$restProps}
  >
    <LoadingSpinner {small} {description} />
  </div>
{/if}
