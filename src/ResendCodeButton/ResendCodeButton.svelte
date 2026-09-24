<script>
  /**
   * @event {null} resend
   * @restProps {button}
   */

  /**
   * Specify the cooldown in seconds after a resend.
   * Set to `0` to disable the cooldown.
   */
  export let cooldown = 30;

  /**
   * Set to `false` to make the button available on mount
   * instead of starting the cooldown.
   */
  export let startOnMount = true;

  /** Specify the button text when a resend is available */
  export let labelText = "Resend code";

  /**
   * Override the button text during the cooldown.
   * @type {(seconds: number) => string}
   */
  export let cooldownText = function cooldownText(seconds) {
    return `Resend code in ${seconds}s`;
  };

  /**
   * Seconds left in the cooldown; `0` when a resend is available.
   * @bindable readonly
   */
  export let remaining = 0;

  /**
   * Specify the kind of button.
   * @type {"primary" | "secondary" | "tertiary" | "ghost"}
   */
  export let kind = "ghost";

  /**
   * Specify the size of button.
   * @type {"default" | "field" | "small"}
   */
  export let size = "small";

  /** Set to `true` to disable the button */
  export let disabled = false;

  import { createEventDispatcher, onMount } from "svelte";
  import Button from "../Button/Button.svelte";

  const dispatch = createEventDispatcher();

  /** @type {ReturnType<typeof setInterval> | undefined} */
  let interval;
  let deadline = 0;

  function stopTimer() {
    if (interval !== undefined) {
      clearInterval(interval);
      interval = undefined;
    }
  }

  function updateRemaining() {
    remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    if (remaining === 0) stopTimer();
  }

  /** Start (or restart) the cooldown. */
  export function start() {
    stopTimer();
    if (!(cooldown > 0)) {
      remaining = 0;
      return;
    }
    deadline = Date.now() + cooldown * 1000;
    remaining = Math.ceil(cooldown);
    // Recompute from the deadline so a throttled background tab catches up.
    interval = setInterval(updateRemaining, 1000);
  }

  /** End the cooldown so a resend is available now. */
  export function reset() {
    stopTimer();
    remaining = 0;
  }

  /** @type {(event: MouseEvent) => void} */
  function handleClick(event) {
    if (disabled || remaining > 0) {
      event.preventDefault();
      return;
    }
    if (dispatch("resend", null, { cancelable: true })) start();
  }

  $: coolingDown = !disabled && remaining > 0;

  onMount(() => {
    if (startOnMount) start();
    return stopTimer;
  });
</script>

<!-- Cooldown keeps the button focusable: native `disabled` would move focus
  to <body> right after the click that started it (see Button's `loading`). -->
<Button
  {kind}
  {size}
  {disabled}
  {...$$restProps}
  aria-disabled={coolingDown || undefined}
  class={[coolingDown && "bx--btn--disabled", $$restProps.class]
    .filter(Boolean)
    .join(" ") || undefined}
  on:click={handleClick}
  on:click
  on:focus
  on:blur
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  {remaining > 0 ? cooldownText(remaining) : labelText}
</Button>
