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
   * Specify the delay (ms) before rendering while `status` is `"active"`.
   * Operations that finish within the delay never show the pending state.
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
  import { createDelayedSetter } from "../utils/delayed-setter.js";
  import InlineLoadingContent from "./InlineLoadingContent.svelte";

  const dispatch = createEventDispatcher();
  const schedule = createDelayedSetter();
  const scheduleSuccess = createDelayedSetter();
  const fadePreset = { fn: fade };

  $: ({
    fn: transitionFn,
    params: transitionParams,
    animated,
  } = resolveTransition(transition, fadePreset));

  // `delay > 0` renders nothing during SSR while `status` is "active", since the timer only fires client-side.
  let visible = false;

  // With `successDelay={0}` the event dispatches synchronously; during init (Svelte 3/4) the parent hasn't attached `on:success` yet.
  let mounted = false;

  onMount(() => {
    mounted = true;

    return () => {
      scheduleSuccess.cancel();
      schedule.cancel();
    };
  });

  $: if (mounted && status === "finished") {
    scheduleSuccess(successDelay, () => {
      dispatch("success");
    });
  } else {
    scheduleSuccess.cancel();
  }

  $: if (status === "active") {
    // Re-hide on every entry into "active", even if a prior resting status left `visible` true.
    visible = false;
    schedule(delay, () => {
      visible = true;
    });
  } else {
    schedule.cancel();
    visible = true;
  }
</script>

{#if visible && animated}
  <div
    class:bx--inline-loading={true}
    class:bx--inline-loading--sm={size === "sm"}
    role={status === "error" ? "alert" : "status"}
    aria-live={status === "error" ? "assertive" : "polite"}
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
    <InlineLoadingContent {status} {description} {iconDescription} />
  </div>
{:else if visible}
  <div
    class:bx--inline-loading={true}
    class:bx--inline-loading--sm={size === "sm"}
    role={status === "error" ? "alert" : "status"}
    aria-live={status === "error" ? "assertive" : "polite"}
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  >
    <InlineLoadingContent {status} {description} {iconDescription} />
  </div>
{/if}
