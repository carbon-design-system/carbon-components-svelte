<script>
  /**
   * @restProps {div}
   * @slot {{ step: import("./step-flow.js").StepInfo }}
   * @slot {{ error: unknown }} error - The notification's content. Defaults to the error's message.
   */

  /**
   * Specify the flow from `createStepFlow`.
   * @type {import("./step-flow.js").StepFlow}
   */
  export let flow;

  /**
   * Specify the id of the step in the flow.
   * @type {string}
   */
  export let id;

  /**
   * Specify the heading. Defaults to the step's label.
   * @type {string | undefined}
   */
  export let title = undefined;

  /**
   * Specify the text read with the heading, and shown above it, such as
   * `Step 2 of 4`.
   * @type {(info: { number: number, total: number, label: string }) => string}
   */
  export let stepText = defaultStepText;

  /**
   * Set to `false` to remove the step's content from the page while the user
   * is on another step. The step then loses the state of components that
   * keep their own, such as `FileUploader`, and a change made in it is no
   * longer seen by the unsaved-changes guard.
   */
  export let keepMounted = true;

  /** Specify the title of the error notification. */
  export let errorTitle = "Something went wrong";

  import Heading from "../Heading/Heading.svelte";
  import InlineNotification from "../Notification/InlineNotification.svelte";
  import Stack from "../Stack/Stack.svelte";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { defaultStepText } from "./step-flow.js";

  const headingId = uniqueId("ccs-create-flow-heading");

  /** @type {import("./step-flow.js").StepInfo | undefined} */
  let last;
  $: info = $flow.steps.find((item) => item.id === id);
  $: if (info) last = info;
  $: active = Boolean(info?.current);
  // Built on the first visit and kept, so a step nobody reached costs nothing.
  let built = false;
  $: if (active) built = true;
  $: step = info ?? last;
  $: prefix = step ? stepText({ ...step, label: title ?? step.label }) : "";
  $: error = active ? $flow.error : null;
  // With a spread, Svelte 3 writes `false` as the attribute `hidden="false"`,
  // which hides the step; `undefined` removes it.
  $: hidden = active ? undefined : true;
  // The consumer's name replaces the heading as the step's name.
  $: ({
    ariaLabel,
    ariaLabelledBy,
    ariaDescribedBy,
    rest: groupProps,
  } = splitAriaNaming($$restProps));
</script>

{#if built && step}
  <div
    role="group"
    aria-label={ariaLabel}
    aria-labelledby={ariaLabelledBy ??
      (ariaLabel === undefined ? headingId : undefined)}
    aria-describedby={ariaDescribedBy}
    {hidden}
    data-create-flow-step={id}
    class:bx--create-flow__step={true}
    {...groupProps}
  >
    <Stack gap={6}>
      <div class:bx--create-flow__header={true}>
        <p class:bx--create-flow__count={true} aria-hidden="true">{prefix}</p>
        <Heading
          id={headingId}
          tabindex={-1}
          type="heading-03"
          class="bx--create-flow__heading"
          data-create-flow-heading
        >
          <span class:bx--visually-hidden={true}>{prefix}:</span>{" "}{title ??
            step.label}
        </Heading>
      </div>
      {#if error}
        <div
          class:bx--create-flow__error={true}
          data-create-flow-error
          tabindex="-1"
        >
          <InlineNotification
            lowContrast
            fullWidth
            kind="error"
            title={errorTitle}
            on:close={flow.clearError}
          >
            <slot name="error" {error}>
              {error instanceof Error ? error.message : String(error)}
            </slot>
          </InlineNotification>
        </div>
      {/if}
      {#if active || keepMounted}
        <slot {step} />
      {/if}
    </Stack>
  </div>
{/if}
