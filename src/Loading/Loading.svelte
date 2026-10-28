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
  import LoadingSpinner from "./LoadingSpinner.svelte";
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
      <LoadingSpinner {small} {active} {description} />
    </div>
  {:else}
    <LoadingSpinner {small} {active} {description} {...$$restProps} />
  {/if}
{/if}
