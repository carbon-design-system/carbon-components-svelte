<script>
  /**
   * @restProps {form}
   * @slot {{}}
   * @slot {{}} submitted - What the user sees once the flow is submitted. Receives focus.
   */

  /**
   * Specify the flow from `createStepFlow`.
   * @type {import("./step-flow.js").StepFlow}
   */
  export let flow;

  /**
   * Specify a store from `createUnsavedChanges` to report a change in any
   * step to. The form is tracked while it is mounted; set it before mount.
   * @type {import("../UnsavedChanges/unsaved-changes.js").UnsavedChangesStore | undefined}
   */
  export let unsavedChanges = undefined;

  /**
   * Obtain a reference to the form element.
   * @type {null | HTMLFormElement}
   * @bindable readonly
   */
  export let ref = null;

  import { onMount, tick } from "svelte";
  import Form from "../Form/Form.svelte";
  import { trackUnsavedChanges } from "../UnsavedChanges/track-unsaved-changes.js";

  /**
   * @param {HTMLFormElement} node
   * @param {import("../UnsavedChanges/unsaved-changes.js").UnsavedChangesStore | undefined} store
   */
  function track(node, store) {
    const action = store ? trackUnsavedChanges(node, { store }) : null;
    return { destroy: () => action?.destroy() };
  }

  /** @param {Element | null | undefined} element */
  function focusable(element) {
    if (!(element instanceof HTMLElement)) return null;
    if (element.matches("input, select, textarea, button")) return element;
    return element.querySelector("input, select, textarea, button");
  }

  /** @param {import("./step-flow.js").StepFlowFocusRequest["target"]} target */
  function focusTarget(target) {
    if (!ref || !target) return;
    const step = ref.querySelector("[data-create-flow-step]:not([hidden])");
    /** @type {Element | null | undefined} */
    let element;
    if (target === "invalid") {
      element = focusable(
        step?.querySelector('[aria-invalid="true"], [data-invalid="true"]'),
      );
    } else if (target === "error") {
      element = step?.querySelector("[data-create-flow-error]");
    } else if (target === "submitted") {
      element = ref.querySelector("[data-create-flow-submitted]");
    }
    // A step with nothing marked invalid, or no error to show: its heading.
    const toFocus =
      element ?? step?.querySelector("[data-create-flow-heading]");
    if (toFocus instanceof HTMLElement) toFocus.focus();
  }

  onMount(() => {
    // A request made before this form mounted is not ours to answer.
    let seen = -1;
    return flow.focus.subscribe((request) => {
      if (seen === -1) {
        seen = request.count;
        return;
      }
      if (request.count === seen) return;
      seen = request.count;
      tick().then(() => focusTarget(request.target));
    });
  });
</script>

<Form
  bind:ref
  novalidate
  id="{flow.id}-form"
  actions={[[track, unsavedChanges]]}
  {...$$restProps}
  on:submit={(event) => {
    event.preventDefault();
    flow.next();
  }}
>
  <slot />
  {#if $flow.submitted}
    <div
      class:bx--create-flow__submitted={true}
      data-create-flow-submitted
      tabindex="-1"
    >
      <slot name="submitted" />
    </div>
  {/if}
</Form>
