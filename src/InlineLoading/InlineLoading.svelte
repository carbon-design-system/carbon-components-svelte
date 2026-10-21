<script>
  /**
   * @restProps {div} Pass `role` or `aria-live` to override the status-derived defaults.
   */

  /**
   * Set the loading status.
   * @type {"active" | "inactive" | "finished" | "error"}
   */
  export let status = "active";

  /**
   * Set the loading description.
   * @type {string}
   */
  export let description = undefined;

  /**
   * Specify a description for the loading icon.
   * Defaults to the `status` prop for the "error" and "finished" states.
   * @type {string}
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

  import { createEventDispatcher, onMount } from "svelte";
  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";
  import ErrorFilled from "../icons/ErrorFilled.svelte";
  import Loading from "../Loading/Loading.svelte";
  import { createDelayedSetter } from "../utils/delayed-setter.js";

  const dispatch = createEventDispatcher();
  const schedule = createDelayedSetter();
  const scheduleSuccess = createDelayedSetter();

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

{#if visible}
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
    <div class:bx--inline-loading__animation={true}>
      {#if status === "error"}
        <ErrorFilled
          class="bx--inline-loading--error"
          title={iconDescription || status}
        />
      {:else if status === "finished"}
        <CheckmarkFilled
          class="bx--inline-loading__checkmark-container"
          title={iconDescription || status}
        />
      {:else if status === "inactive" || status === "active"}
        <Loading
          small
          description={iconDescription}
          withOverlay={false}
          active={status === "active"}
        />
      {/if}
    </div>
    {#if description}
      <div class:bx--inline-loading__text={true}>{description}</div>
    {/if}
  </div>
{/if}
