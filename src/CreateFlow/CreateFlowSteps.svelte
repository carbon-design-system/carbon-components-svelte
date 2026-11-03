<script>
  /**
   * @restProps {nav}
   * @event {number} change - A step was chosen in the rail, and the flow went to it.
   */

  /**
   * Specify the flow from `createStepFlow`.
   * @type {import("./step-flow.js").StepFlow}
   */
  export let flow;

  /**
   * Set to `false` for a horizontal rail, such as in a modal's body.
   * Below the `md` breakpoint a vertical rail shows the current step alone.
   */
  export let vertical = true;

  /**
   * Specify the accessible name of the step list.
   * @type {string}
   */
  export let label = "Steps";

  /**
   * Specify the assistive text appended to a complete or invalid step's name.
   * @type {(status: "complete" | "invalid") => string}
   */
  export let statusText = function statusText(status) {
    return status;
  };

  import { createEventDispatcher } from "svelte";
  import ProgressIndicator from "../ProgressIndicator/ProgressIndicator.svelte";
  import ProgressStep from "../ProgressIndicator/ProgressStep.svelte";

  const dispatch = createEventDispatcher();

  /** @param {number} index */
  function choose(index) {
    const step = $flow.steps[index];
    if (step && flow.goTo(step.id)) dispatch("change", index);
  }

  /**
   * ProgressStep leaves an incomplete step to the consumer, and a flow that
   * isn't linear can enter one.
   * @param {import("./step-flow.js").StepInfo} step
   */
  function chooseIncomplete(step) {
    if (step.complete || step.current || !step.reachable) return;
    if (flow.goTo(step.id)) dispatch("change", step.index);
  }

  // The step's id prefixed, so two flows on a page never share a DOM id.
  /** @param {string} id */
  const domId = (id) => `${flow.id}-step-${id}`;
</script>

<nav
  aria-label={label}
  class:bx--create-flow__steps={true}
  class:bx--create-flow__steps--vertical={vertical}
  {...$$restProps}
>
  <ProgressIndicator
    {vertical}
    selectedId={$flow.current ? domId($flow.current.id) : undefined}
    preventChangeOnClick={$flow.busy || $flow.submitted}
    {statusText}
    on:change={(event) => choose(event.detail)}
  >
    {#each $flow.steps as step (step.id)}
      <ProgressStep
        id={domId(step.id)}
        label={step.label}
        secondaryLabel={step.secondaryLabel}
        complete={step.complete}
        current={step.current}
        invalid={step.invalid}
        disabled={step.disabled}
        on:click={() => chooseIncomplete(step)}
      />
    {/each}
  </ProgressIndicator>
</nav>
