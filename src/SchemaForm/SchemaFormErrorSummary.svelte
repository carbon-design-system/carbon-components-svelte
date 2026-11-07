<script>
  /**
   * Lists the errors of a form with a link to each field, for the top of
   * the form. Focus it after a failed submit: it takes focus, and a link
   * moves focus to the field.
   * @restProps {div}
   */

  /**
   * The errors to list, from `form.errorList`.
   * @type {ReadonlyArray<{ id: string; message: string }>}
   */
  export let errors = [];

  /** Specify the heading text. */
  export let title = "There is a problem";

  /**
   * Set an id for the summary element.
   * The heading's id derives from it as `{id}-title`.
   */
  export let id = uniqueId("ccs-error-summary");

  /** Obtain a reference to the summary element. */
  export let ref = null;

  /**
   * Move focus to the field with this id, or to the first control inside
   * the element that has it (a group of radios, an array of rows).
   * @type {(id: string) => void}
   */
  export let focusField = defaultFocusField;

  import { uniqueId } from "../utils/unique-id.js";

  $: titleId = `${id}-title`;

  const FOCUSABLE =
    'input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled), [tabindex="0"]';

  /** @param {string} id */
  function defaultFocusField(id) {
    const target = document.getElementById(id);
    if (!target) return;
    const control = target.matches(FOCUSABLE)
      ? target
      : target.querySelector(FOCUSABLE);
    /** @type {HTMLElement} */ (control ?? target).focus();
    /** @type {HTMLElement} */ (control ?? target).scrollIntoView?.({
      block: "center",
    });
  }

  /**
   * @param {MouseEvent} event
   * @param {string} id
   */
  function onClick(event, id) {
    event.preventDefault();
    focusField(id);
  }
</script>

<div
  bind:this={ref}
  {id}
  class:bx--schema-form__summary={true}
  role="group"
  aria-labelledby={$$restProps["aria-label"] ? undefined : titleId}
  tabindex="-1"
  {...$$restProps}
>
  <h2 class:bx--schema-form__summary-title={true} id={titleId}>{title}</h2>
  <ul class:bx--schema-form__summary-list={true}>
    {#each errors as error (error.id)}
      <li>
        <a href="#{error.id}" on:click={(event) => onClick(event, error.id)}
          >{error.message}</a
        >
      </li>
    {/each}
  </ul>
</div>
