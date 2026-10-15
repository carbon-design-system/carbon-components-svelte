<script>
  /**
   * @restProps {div}
   * @event {number} change
   * @event {null} submit
   * @slot {{ step: number; submitted: boolean }} - The current step's content. `submitted` is `true` once `onSubmit` resolves.
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

  /** Specify the text announced while `onSubmit` is pending */
  export let submittingDescription = "Submitting";

  /**
   * Specify the work to run on submit. While a returned promise is
   * pending, the submit button shows its loading state and Back is
   * disabled. When it resolves, `submitted` becomes `true`, every step is
   * complete, the buttons are removed, and `submit` is dispatched. When it
   * rejects, the error is shown above the buttons.
   * @type {() => void | Promise<void>}
   */
  export let onSubmit = () => {};

  /** Specify the error shown when `onSubmit` rejects without a message */
  export let errorText = "Something went wrong. Try again.";

  /**
   * Set to `true` once the flow is submitted. Set it back to `false`, with
   * `step` to `0`, to start again.
   * @bindable writable
   */
  export let submitted = false;

  /** Set to `true` to space the progress steps equally */
  export let spaceEqually = false;

  import { createEventDispatcher, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import ArrowLeft from "../icons/ArrowLeft.svelte";
  import ArrowRight from "../icons/ArrowRight.svelte";
  import InlineNotification from "../Notification/InlineNotification.svelte";
  import ProgressIndicator from "../ProgressIndicator/ProgressIndicator.svelte";
  import ProgressStep from "../ProgressIndicator/ProgressStep.svelte";

  const dispatch = createEventDispatcher();

  /** @type {null | HTMLDivElement} */
  let panelRef = null;
  let pending = false;
  /** @type {string | undefined} */
  let error = undefined;

  $: last = step >= steps.length - 1;

  /** @param {number} next */
  async function go(next) {
    step = next;
    error = undefined;
    dispatch("change", step);
    // Move focus to the new step, so keyboard and screen reader users
    // start there instead of on a button that may have gone.
    await tick();
    panelRef?.focus();
  }

  async function submit() {
    if (pending || !validate(step)) return;
    pending = true;
    error = undefined;
    try {
      await onSubmit();
    } catch (reason) {
      error =
        reason instanceof Error && reason.message ? reason.message : errorText;
      return;
    } finally {
      pending = false;
    }
    submitted = true;
    dispatch("submit");
    await tick();
    panelRef?.focus();
  }

  function next() {
    if (last) submit();
    else if (validate(step)) go(step + 1);
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
  {#if error}
    <InlineNotification
      fullWidth
      lowContrast
      hideCloseButton
      kind="error"
      title={error}
    />
  {/if}
  {#if !submitted}
    <div class:bx--stepper__actions={true}>
      {#if step > 0}
        <Button
          kind="ghost"
          icon={ArrowLeft}
          disabled={pending}
          on:click={() => go(step - 1)}
        >
          {backText}
        </Button>
      {/if}
      <Button
        icon={last ? undefined : ArrowRight}
        disabled={nextDisabled}
        loading={pending}
        loadingDescription={submittingDescription}
        on:click={next}
      >
        {last ? submitText : nextText}
      </Button>
    </div>
  {/if}
</div>
