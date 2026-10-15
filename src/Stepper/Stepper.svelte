<script>
  /**
   * @restProps {div}
   * @event {number} change
   * @event {null} submit - Continue was pressed on the last step and `validate` passed.
   * @event {{ error: unknown }} submit:error
   * @slot {{ currentIndex: number; submitted: boolean }} - The current step's content, and the confirmation once `submitted` is `true`.
   */

  /**
   * Specify the step labels, in order.
   * If the list gets shorter than `currentIndex`, the stepper moves to its
   * last step.
   * @type {ReadonlyArray<string>}
   */
  export let steps = [];

  /**
   * Specify the index of the current step, as on ProgressIndicator.
   * @bindable writable
   */
  export let currentIndex = 0;

  /**
   * Specify a check that runs when Continue is pressed, such as one that
   * marks invalid fields. Return `false`, or a promise of `false`, to stay
   * on the step; focus then moves to the step's first invalid field. While
   * a promise is pending, Continue shows its loading state.
   * @type {(index: number) => boolean | Promise<boolean>}
   */
  export let validate = () => true;

  /**
   * Specify the work to run on submit, after the `submit` event. When it
   * returns a promise, the submit button shows its loading state until the
   * promise settles: on success `submitted` becomes `true`, and on failure
   * the stepper dispatches `submit:error` and focuses the submit button.
   * Without it, set `submitting` and `submitted` yourself.
   * @type {undefined | (() => void | Promise<unknown>)}
   */
  export let submit = undefined;

  /** Set to `true` to disable Continue, or the submit button on the last step */
  export let nextDisabled = false;

  /** Specify the text of the Back button */
  export let backText = "Back";

  /** Specify the text of the Continue button */
  export let nextText = "Continue";

  /** Specify the text of the submit button on the last step */
  export let submitText = "Submit";

  /** Specify the text announced while an async `validate` runs */
  export let validatingDescription = "Checking";

  /**
   * Set to `true` while the submission runs: the submit button shows its
   * loading state and Back is disabled. `submit` sets this state on its own.
   */
  export let submitting = false;

  /** Specify the text announced while submitting */
  export let submittingDescription = "Submitting";

  /**
   * Set to `true` once the submission succeeds: every step is complete,
   * the buttons are removed, and focus moves to the content. Set it back
   * to `false`, with `currentIndex` to `0`, to start again.
   * @bindable writable
   */
  export let submitted = false;

  /** Set to `true` to space the progress steps equally */
  export let spaceEqually = false;

  import { afterUpdate, createEventDispatcher, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import ArrowLeft from "../icons/ArrowLeft.svelte";
  import ArrowRight from "../icons/ArrowRight.svelte";
  import ProgressIndicator from "../ProgressIndicator/ProgressIndicator.svelte";
  import ProgressStep from "../ProgressIndicator/ProgressStep.svelte";

  const dispatch = createEventDispatcher();

  /** @type {null | HTMLDivElement} */
  let panelRef = null;
  /** @type {null | HTMLButtonElement} */
  let nextRef = null;
  /** Whether an async `validate` is running. */
  let checking = false;
  /** Whether a `submit` promise is in flight. */
  let pending = false;

  $: busy = submitting || pending || checking;
  $: lastIndex = Math.max(0, steps.length - 1);
  // A conditional step can drop out of the list, such as payment for a
  // free plan; stay on a step that exists.
  $: if (currentIndex > lastIndex) currentIndex = lastIndex;
  $: last = currentIndex >= lastIndex;

  /** @param {number} index */
  async function go(index) {
    currentIndex = index;
    dispatch("change", currentIndex);
    // Move focus to the new step, so keyboard and screen reader users
    // start there instead of on a button that may have gone.
    await tick();
    panelRef?.focus();
  }

  // Focus the step's first invalid field, as marked by `validate`, or
  // Continue again when no field is marked.
  function focusFirstInvalid() {
    const invalid = panelRef?.querySelector('[aria-invalid="true"]');
    const target = invalid?.matches("input, select, textarea, button")
      ? invalid
      : invalid?.querySelector("input, select, textarea, button");
    (target instanceof HTMLElement ? target : nextRef)?.focus();
  }

  async function next() {
    // A second press while a check or submission runs is ignored.
    if (busy) return;
    const index = currentIndex;
    let valid;
    try {
      const result = validate(index);
      if (typeof result?.then === "function") {
        checking = true;
        valid = await result;
      } else {
        valid = result;
      }
    } catch {
      valid = false;
    } finally {
      checking = false;
    }
    // The user went back to another step while the check ran.
    if (index !== currentIndex || submitted) return;
    if (!valid) {
      await tick();
      focusFirstInvalid();
      return;
    }
    if (!last) {
      go(index + 1);
      return;
    }
    dispatch("submit");
    if (!submit) return;
    try {
      const result = submit();
      if (typeof result?.then === "function") {
        pending = true;
        await result;
      }
      submitted = true;
    } catch (error) {
      dispatch("submit:error", { error });
      await tick();
      nextRef?.focus();
    } finally {
      pending = false;
    }
  }

  // Focus the confirmation once the flow is submitted.
  let wasSubmitted = submitted;
  afterUpdate(() => {
    if (submitted && !wasSubmitted) panelRef?.focus();
    wasSubmitted = submitted;
  });
</script>

<div class:bx--stepper={true} {...$$restProps}>
  <!-- A completed step can be clicked to go back to it; steps ahead can't,
       so validation can't be skipped. -->
  <ProgressIndicator
    {currentIndex}
    {spaceEqually}
    preventChangeOnClick={submitted || busy}
    on:change={(event) => go(event.detail)}
  >
    {#each steps as label, index (index)}
      <ProgressStep
        {label}
        complete={submitted || index < currentIndex}
        current={!submitted && index === currentIndex}
      />
    {/each}
  </ProgressIndicator>
  <div
    bind:this={panelRef}
    class:bx--stepper__panel={true}
    role="group"
    aria-label={steps[currentIndex]}
    tabindex="-1"
  >
    <slot {currentIndex} {submitted} />
  </div>
  {#if !submitted}
    <div class:bx--stepper__actions={true}>
      {#if currentIndex > 0}
        <Button
          kind="ghost"
          icon={ArrowLeft}
          disabled={busy}
          on:click={() => go(currentIndex - 1)}
        >
          {backText}
        </Button>
      {/if}
      <Button
        bind:ref={nextRef}
        icon={last ? undefined : ArrowRight}
        disabled={nextDisabled}
        loading={busy}
        loadingDescription={checking
          ? validatingDescription
          : submittingDescription}
        on:click={next}
      >
        {last ? submitText : nextText}
      </Button>
    </div>
  {/if}
</div>
