<script>
  /**
   * @restProps {button}
   * @event {WindowEventMap["click"]} click
   */

  /** Specify the checklist's title, the launcher's visible name. */
  export let title = "Getting started";

  /** Specify the number of completed tasks. */
  export let complete = 0;

  /** Specify the number of tasks that count. */
  export let total = 0;

  /**
   * Specify the progress text, which a screen reader reads after the title.
   * @type {(complete: number, total: number) => string}
   */
  export let progressText = defaultProgressText;

  /**
   * Set to `true` once every task is done. The ring fills and the progress
   * text reads `allSetText`.
   */
  export let allSet = false;

  /** Specify the text that replaces the progress once every task is done. */
  export let allSetText = "All set";

  /**
   * Specify the id of the checklist panel this launcher opens. It sets
   * `aria-controls`.
   * @type {string | undefined}
   */
  export let controls = undefined;

  /**
   * Obtain a reference to the button element.
   * @bindable readonly
   * @type {null | HTMLButtonElement}
   */
  export let ref = null;

  import Task from "../icons/Task.svelte";

  /**
   * @param {number} complete
   * @param {number} total
   */
  function defaultProgressText(complete, total) {
    return `${complete} of ${total} complete`;
  }

  const RADIUS = 9;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  $: ratio = allSet ? 1 : total > 0 ? Math.min(complete / total, 1) : 0;
  $: label = allSet ? allSetText : progressText(complete, total);
</script>

<button
  bind:this={ref}
  type="button"
  aria-label="{title}, {label}"
  aria-expanded="false"
  aria-controls={controls}
  {...$$restProps}
  class:bx--onboarding-launcher={true}
  class:bx--onboarding-launcher--complete={allSet}
  on:click
>
  <span class:bx--onboarding-launcher__ring={true} aria-hidden="true">
    <svg viewBox="0 0 24 24" width="24" height="24" focusable="false">
      <circle
        class:bx--onboarding-launcher__track={true}
        cx="12"
        cy="12"
        r={RADIUS}
      />
      <circle
        class:bx--onboarding-launcher__arc={true}
        cx="12"
        cy="12"
        r={RADIUS}
        stroke-dasharray={CIRCUMFERENCE}
        stroke-dashoffset={CIRCUMFERENCE * (1 - ratio)}
        transform="rotate(-90 12 12)"
      />
    </svg>
    <Task size={12} class="bx--onboarding-launcher__icon" />
  </span>
  <span class:bx--onboarding-launcher__text={true}>
    <span class:bx--onboarding-launcher__title={true}>{title}</span>
    <span class:bx--onboarding-launcher__progress={true}>{label}</span>
  </span>
</button>
