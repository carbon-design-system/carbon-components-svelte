<script>
  /**
   * @restProps {div} Pass `role` or `aria-live` to override the status-derived defaults.
   */

  /**
   * @event {CustomEvent<null>} introstart
   * @event {CustomEvent<null>} introend
   * @event {CustomEvent<null>} outrostart
   * @event {CustomEvent<null>} outroend
   */

  /**
   * Set the loading status.
   * @type {"active" | "inactive" | "finished" | "error"}
   */
  export let status = "active";

  /**
   * Set the loading description.
   * @type {string | undefined}
   */
  export let description = undefined;

  /**
   * Specify a description for the loading icon.
   * Defaults to the `status` prop for the "error" and "finished" states.
   * @type {string | undefined}
   */
  export let iconDescription = undefined;

  /** Specify the timeout delay (ms) before the `success` event fires after `status` is set to "finished" */
  export let successDelay = 1500;

  /**
   * Wait this many milliseconds after `status` turns `"active"` before
   * showing the spinner. Once shown, the spinner stays for at least 500 ms,
   * so fast work shows nothing and slow work never flashes. A status that
   * arrives inside that time waits for it. While it waits, the spinner is
   * in the page but hidden, so server HTML already holds it. `"inactive"`,
   * `"finished"` and `"error"` render at once.
   * Set to `0` to show the spinner at once.
   */
  export let delay = 0;

  /**
   * Set the size: `"sm"` fits a line of small text, such as a "Saving…"
   * status in a toolbar or list row, with 12px text and no minimum height.
   * @type {"sm" | "md"}
   */
  export let size = "md";

  /**
   * Animate the status as it appears and leaves, when a parent's `{#if}`
   * adds or removes it. Set to `true` for Carbon's fade, to fade params
   * (e.g., `{ duration: "moderate02" }`) to customize it, or to `{ fn }` to
   * use another transition. The status does not animate by default.
   * @type {import("../motion/resolve-transition.js").TransitionProp<import("../motion/transitions.js").FadeParams>}
   */
  export let transition = undefined;

  import { createEventDispatcher, onMount } from "svelte";
  import { resolveTransition } from "../motion/resolve-transition.js";
  import { fade } from "../motion/transitions.js";
  import { createLoadingDelay } from "../utils/delayed-loading.js";
  import { createDelayedSetter } from "../utils/delayed-setter.js";
  import InlineLoadingContent from "./InlineLoadingContent.svelte";

  const dispatch = createEventDispatcher();
  const scheduleSuccess = createDelayedSetter();
  const fadePreset = { fn: fade };

  $: ({
    fn: transitionFn,
    params: transitionParams,
    animated,
  } = resolveTransition(transition, fadePreset));

  // `shown` is the spinner the user sees. With a delay, an active spinner
  // first renders `waiting`: in the page but hidden, and CSS reveals it
  // after `delay` even before the script runs. The server HTML, the first
  // client render and a spinner mounted for fast work all start this way.
  let shown = delay > 0 ? false : status === "active";

  // With `successDelay={0}` the event dispatches synchronously; during init (Svelte 3/4) the parent hasn't attached `on:success` yet.
  let mounted = false;
  /** @type {import("../utils/delayed-loading.js").LoadingDelay | undefined} */
  let loadingTimer;

  /** @param {number} delay */
  function createTimer(delay) {
    const timer = createLoadingDelay(
      (next) => {
        shown = next;
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
  $: loadingTimer?.(status === "active");

  onMount(() => {
    mounted = true;

    return () => {
      scheduleSuccess.cancel();
      loadingTimer?.cancel();
    };
  });

  // A spinner inside its minimum keeps the text it showed with, and the
  // next status waits for it, so the spinner never flashes before "Saved".
  /** @type {string | undefined} */
  let activeDescription = description;
  /** @type {string | undefined} */
  let activeIconDescription = iconDescription;
  $: if (status === "active") {
    activeDescription = description;
    activeIconDescription = iconDescription;
  }

  $: shownStatus = shown ? "active" : status;
  $: held = shown && status !== "active";
  $: waiting = status === "active" && !shown;
  $: revealAfter = waiting ? `${delay}ms` : undefined;
  $: shownDescription = held ? activeDescription : description;
  $: shownIconDescription = held ? activeIconDescription : iconDescription;

  // The check draws on only when work finishes in front of the user, so a
  // component that renders already finished (server HTML, hydration) shows
  // the check drawn.
  let drawCheck = false;
  $: if (mounted && shownStatus !== "finished") drawCheck = true;

  $: if (mounted && shownStatus === "finished") {
    scheduleSuccess(successDelay, () => {
      dispatch("success");
    });
  } else {
    scheduleSuccess.cancel();
  }
</script>

{#if animated}
  <div
    class:bx--inline-loading={true}
    class:bx--inline-loading--sm={size === "sm"}
    class:bx--inline-loading--delayed={waiting}
    style:animation-duration={revealAfter}
    role={shownStatus === "error" ? "alert" : "status"}
    aria-live={shownStatus === "error" ? "assertive" : "polite"}
    {...$$restProps}
    transition:transitionFn|global={transitionParams}
    on:introstart
    on:introend
    on:outrostart
    on:outroend
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <InlineLoadingContent
      status={shownStatus}
      description={shownDescription}
      iconDescription={shownIconDescription}
      {drawCheck}
    />
  </div>
{:else}
  <div
    class:bx--inline-loading={true}
    class:bx--inline-loading--sm={size === "sm"}
    class:bx--inline-loading--delayed={waiting}
    style:animation-duration={revealAfter}
    role={shownStatus === "error" ? "alert" : "status"}
    aria-live={shownStatus === "error" ? "assertive" : "polite"}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <InlineLoadingContent
      status={shownStatus}
      description={shownDescription}
      iconDescription={shownIconDescription}
      {drawCheck}
    />
  </div>
{/if}
