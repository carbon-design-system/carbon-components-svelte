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
   * Specify the delay (ms) before the spinner renders while `active`.
   * Requests that finish within the delay never show a spinner.
   */
  export let delay = 0;

  import { onMount } from "svelte";
  import { createDelayedSetter } from "../utils/delayed-setter.js";
  import { overlayFocus } from "./overlay-focus.js";

  const schedule = createDelayedSetter();

  // `delay > 0` renders nothing during SSR since the timer only fires client-side.
  let visible = false;

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

  $: spinnerRadius = small ? "42" : "44";
</script>

{#if visible}
  {#if withOverlay}
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
        <!-- The <title> names the image; aria-label too would be read twice. -->
        <svg class:bx--loading__svg={true} viewBox="0 0 100 100" role="img">
          <title>{description}</title>
          {#if small}
            <circle
              class:bx--loading__background={true}
              cx="50%"
              cy="50%"
              r={spinnerRadius}
            ></circle>
          {/if}
          <circle
            class:bx--loading__stroke={true}
            cx="50%"
            cy="50%"
            r={spinnerRadius}
          ></circle>
        </svg>
      </div>
    </div>
  {:else}
    <div
      aria-atomic="true"
      aria-live={active ? "assertive" : "off"}
      class:bx--loading={true}
      class:bx--loading--small={small}
      class:bx--loading--stop={!active}
      {...$$restProps}
    >
      <svg class:bx--loading__svg={true} viewBox="0 0 100 100" role="img">
        <title>{description}</title>
        {#if small}
          <circle
            class:bx--loading__background={true}
            cx="50%"
            cy="50%"
            r={spinnerRadius}
          ></circle>
        {/if}
        <circle
          class:bx--loading__stroke={true}
          cx="50%"
          cy="50%"
          r={spinnerRadius}
        ></circle>
      </svg>
    </div>
  {/if}
{/if}
