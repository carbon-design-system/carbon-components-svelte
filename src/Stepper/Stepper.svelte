<script>
  /**
   * @restProps {div}
   * @event {number} change
   * @event {null} submit - Continue was pressed on the last step and `validate` passed.
   * @slot {{ step: number; submitted: boolean }} - The current step's content, and the confirmation once `submitted` is `true`.
   */

  /**
   * Specify the step labels, in order.
   * @type {ReadonlyArray<string>}
   */
  export let steps = [];

  /**
   * Specify the index of the current step.
   * @bindable writable
   */
  export let step = 0;

  /**
   * Specify a check that runs when Continue is pressed, such as one that
   * marks invalid fields. Return `false` to stay on the step.
   * @type {(step: number) => boolean}
   */
  export let validate = () => true;

  /** Set to `true` to disable Continue, or the submit button on the last step */
  export let nextDisabled = false;

  /** Specify the text of the Back button */
  export let backText = "Back";

  /** Specify the text of the Continue button */
  export let nextText = "Continue";

  /** Specify the text of the submit button on the last step */
  export let submitText = "Submit";

  /**
   * Set to `true` while the submission runs: the submit button shows its
   * loading state and Back is disabled.
   */
  export let submitting = false;

  /** Specify the text announced while `submitting` */
  export let submittingDescription = "Submitting";

  /**
   * Set to `true` once the submission succeeds: every step is complete,
   * the buttons are removed, and focus moves to the content. Set it back
   * to `false`, with `step` to `0`, to start again.
   * @bindable writable
   */
  export let submitted = false;

  /** Set to `true` to space the progress steps equally */
  export let spaceEqually = false;

  import { createEventDispatcher, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import ArrowLeft from "../icons/ArrowLeft.svelte";
  import ArrowRight from "../icons/ArrowRight.svelte";
  import ProgressIndicator from "../ProgressIndicator/ProgressIndicator.svelte";
  import ProgressStep from "../ProgressIndicator/ProgressStep.svelte";

  const dispatch = createEventDispatcher();

  /** @type {null | HTMLDivElement} */
  let panelRef = null;
  $: last = step >= steps.length - 1;

  /** @param {number} next */
  async function go(next) {
    step = next;
    dispatch("change", step);
    // Move focus to the new step, so keyboard and screen reader users
    // start there instead of on a button that may have gone.
    await tick();
    panelRef?.focus();
  }

  // Focus the confirmation once the flow is submitted.
  let wasSubmitted = submitted;
  $: if (submitted !== wasSubmitted) {
    wasSubmitted = submitted;
    if (submitted) tick().then(() => panelRef?.focus());
  }

  function next() {
    if (submitting || !validate(step)) return;
    if (last) dispatch("submit");
    else go(step + 1);
  }
</script>

<div class:bx--stepper={true} {...$$restProps}>
  <ProgressIndicator currentIndex={step} {spaceEqually} preventChangeOnClick>
    {#each steps as label, index (index)}
      <ProgressStep
        {label}
        complete={submitted || index < step}
        current={!submitted && index === step}
      />
    {/each}
  </ProgressIndicator>
  <div
    bind:this={panelRef}
    class:bx--stepper__panel={true}
    role="group"
    aria-label={steps[step]}
    tabindex="-1"
  >
    <slot {step} {submitted} />
  </div>
  {#if !submitted}
    <div class:bx--stepper__actions={true}>
      {#if step > 0}
        <Button
          kind="ghost"
          icon={ArrowLeft}
          disabled={submitting}
          on:click={() => go(step - 1)}
        >
          {backText}
        </Button>
      {/if}
      <Button
        icon={last ? undefined : ArrowRight}
        disabled={nextDisabled}
        loading={submitting}
        loadingDescription={submittingDescription}
        on:click={next}
      >
        {last ? submitText : nextText}
      </Button>
    </div>
  {/if}
</div>
