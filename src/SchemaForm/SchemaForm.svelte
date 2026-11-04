<script>
  /**
   * @restProps {form}
   * @event {import("./create-form.js").FormValues} submit - Dispatched with the values after the form passes validation.
   * @event {Array<{ path: string; id: string; message: string; label: string }>} invalid - Dispatched with the errors when a submit fails validation.
   * @event {null} reset
   * @slot {{ form: import("./create-form.js").SchemaFormStore; submitting: boolean; }} actions
   */

  /**
   * Specify the fields to render.
   * @type {import("./create-form.js").FieldConfig[] | undefined}
   */
  export let fields = undefined;

  /**
   * Specify a JSON Schema (a subset of draft 2020-12) to render instead
   * of `fields`.
   * @type {Record<string, unknown> | undefined}
   */
  export let schema = undefined;

  /**
   * Specify the `ui:` options for `schema`, shaped like it.
   * @type {Record<string, unknown> | undefined}
   */
  export let uiSchema = undefined;

  /**
   * Specify the starting values.
   * @type {import("./create-form.js").FormValues | undefined}
   */
  export let initialValues = undefined;

  /**
   * Specify when a field is checked: on `"blur"` (default), on every
   * `"change"` or on `"submit"`. A field that shows an error, or any field
   * after a failed submit, is checked on every change.
   * @type {"change" | "blur" | "submit"}
   */
  export let validateOn = "blur";

  /**
   * Override the text of a rule's message, by rule name.
   * @type {import("./create-form.js").FormMessages | undefined}
   */
  export let messages = undefined;

  /**
   * Specify what a hidden field does to the values: `"omit"` leaves it out,
   * `"keep"` keeps it.
   * @type {"omit" | "keep"}
   */
  export let hidden = "omit";

  /**
   * Add widgets by field `type`, or replace the default ones. Each is a
   * component that takes the field's state as props and dispatches
   * `change` with the new value.
   * @type {Record<string, import("./create-form.js").WidgetComponent>}
   */
  export let widgets = {};

  /**
   * Override the text of the form's own controls and announcements.
   * @type {Partial<import("./context.js").SchemaFormLabels>}
   */
  export let labels = {};

  /**
   * Set to `true` to use the fluid variant.
   */
  export let fluid = false;

  /**
   * Set to `true` to let the browser submit the form to its `action` once
   * it passes validation. The fields post under names like
   * `addresses[0].city`.
   */
  export let native = false;

  /**
   * Set to `true` to mark the optional fields with "(optional)" in their
   * labels.
   */
  export let optionalMark = false;

  /**
   * Set to `true` to hide the submit and reset buttons.
   * Use the "actions" slot to replace them.
   */
  export let hideActions = false;

  /**
   * Called with the values once the form passes validation. The form is
   * busy until the returned promise settles. Return `{ errors }` (by field
   * path) to show errors from a server.
   * @type {((values: import("./create-form.js").FormValues) => unknown) | undefined}
   */
  export let onSubmit = undefined;

  /**
   * The headless form that drives this one. Pass one made with
   * `createForm` to control it, or bind this to get the one it makes.
   * @type {import("./create-form.js").SchemaFormStore | undefined}
   * @bindable writable
   */
  export let form = undefined;

  /**
   * Obtain a reference to the form element.
   * @type {null | HTMLFormElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, onMount, setContext, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import FluidForm from "../FluidForm/FluidForm.svelte";
  import Form from "../Form/Form.svelte";
  import SchemaFormErrorSummary from "./SchemaFormErrorSummary.svelte";
  import SchemaNode from "./SchemaNode.svelte";
  import { DEFAULT_LABELS, SCHEMA_FORM_CONTEXT_KEY } from "./context.js";
  import { createForm } from "./create-form.js";
  import { defaultWidgets } from "./widgets.js";

  const dispatch = createEventDispatcher();

  // The form is made once. To render other fields, key the component.
  const owned = !form;
  if (!form) {
    form = createForm({
      fields,
      schema,
      uiSchema,
      initialValues,
      validateOn,
      messages,
      hidden,
    });
  }
  const store = /** @type {import("./create-form.js").SchemaFormStore} */ (
    form
  );
  const { errorList, submitCount, isSubmitting } = store;

  let announcement = "";
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let announceTimer;

  /** @param {string} message */
  function announce(message) {
    announcement = "";
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
      announcement = message;
    }, 50);
  }

  $: allLabels = { ...DEFAULT_LABELS, ...labels };

  // Read once when the form is made: to change widgets, labels or the
  // optional mark, key the component.
  /** @type {import("./context.js").SchemaFormContext} */
  const context = {
    form: store,
    widgets: { ...defaultWidgets, ...widgets },
    labels: { ...DEFAULT_LABELS, ...labels },
    optionalMark,
    announce,
  };

  setContext(SCHEMA_FORM_CONTEXT_KEY, context);

  /** @type {HTMLDivElement | null} */
  let summary = null;

  /** @param {SubmitEvent} event */
  async function handleSubmit(event) {
    event.preventDefault();
    const element = /** @type {HTMLFormElement} */ (event.currentTarget);
    const ok = await store.submit((values) => {
      dispatch("submit", values);
      return onSubmit?.(values);
    });
    if (!ok) {
      dispatch("invalid", store.getErrors());
      await tick();
      summary?.focus();
    } else if (native) {
      element.submit();
    }
  }

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let resetTimer;

  function handleReset() {
    // The fields restore themselves on this event's next task. Reset after
    // them, so the form's starting values are the last word.
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      store.reset();
      dispatch("reset");
    }, 0);
  }

  onMount(() => () => {
    clearTimeout(announceTimer);
    clearTimeout(resetTimer);
    if (owned) store.destroy();
  });

  $: showSummary = $submitCount > 0 && $errorList.length > 0;
  $: Root = fluid ? FluidForm : Form;
</script>

<svelte:component
  this={Root}
  bind:ref
  id={store.id}
  novalidate
  {...$$restProps}
  on:submit={handleSubmit}
  on:reset={handleReset}
>
  {#if showSummary}
    <SchemaFormErrorSummary
      bind:ref={summary}
      errors={$errorList}
      title={allLabels.summaryTitle($errorList.length)}
    />
  {/if}
  <SchemaNode path="" node={store.root} />
  <slot name="actions" form={store} submitting={$isSubmitting}>
    {#if !hideActions}
      <div class="bx--schema-form__actions">
        <Button type="submit" disabled={$isSubmitting}>
          {allLabels.submit}
        </Button>
        <Button type="reset" kind="secondary" disabled={$isSubmitting}>
          {allLabels.reset}
        </Button>
      </div>
    {/if}
  </slot>
  <div
    class="bx--visually-hidden"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    {announcement}
  </div>
</svelte:component>
