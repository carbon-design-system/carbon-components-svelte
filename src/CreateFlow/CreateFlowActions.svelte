<script>
  /**
   * @event {null} cancel - Cancel was pressed.
   * @event {null} done - Done was pressed after a successful submit.
   */

  /**
   * Specify the flow from `createStepFlow`.
   * @type {import("./step-flow.js").StepFlow}
   */
  export let flow;

  /** Specify the text of the Cancel button */
  export let cancelText = "Cancel";

  /** Specify the text of the Back button */
  export let backText = "Back";

  /** Specify the text of the Next button */
  export let nextText = "Next";

  /** Specify the text of the submit button on the last step */
  export let submitText = "Submit";

  /** Specify the text of the Done button after a successful submit */
  export let doneText = "Done";

  /** Specify the text announced while a validation runs */
  export let validatingDescription = "Checking";

  /** Specify the text announced while submitting */
  export let submittingDescription = "Submitting";

  /** Set to `true` to omit the Cancel button */
  export let hideCancel = false;

  /** Set to `true` to disable Next, or the submit button on the last step */
  export let nextDisabled = false;

  import { createEventDispatcher } from "svelte";
  import Button from "../Button/Button.svelte";

  const dispatch = createEventDispatcher();
</script>

{#if $flow.submitted}
  <Button on:click={() => dispatch("done")}>{doneText}</Button>
{:else}
  {#if !hideCancel}
    <Button
      kind="ghost"
      disabled={$flow.busy}
      on:click={() => dispatch("cancel")}
    >
      {cancelText}
    </Button>
  {/if}
  {#if !$flow.first}
    <Button kind="secondary" disabled={$flow.busy} on:click={flow.back}>
      {backText}
    </Button>
  {/if}
  <Button
    type="submit"
    form="{flow.id}-form"
    disabled={nextDisabled}
    loading={$flow.busy}
    loadingDescription={$flow.status === "validating"
      ? validatingDescription
      : submittingDescription}
  >
    {$flow.last ? submitText : nextText}
  </Button>
{/if}
