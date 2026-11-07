<script>
  /**
   * @typedef {{ fieldId?: string; message: string }} ErrorSummaryItem
   * @restProps {div}
   * @event {{ error: ErrorSummaryItem; index: number }} select - Cancelable. Dispatched when a link is activated, before focus moves. Call `preventDefault()` to move focus yourself, such as to open the tab or panel that holds the field first.
   */

  /**
   * Specify the errors to list, in the order to show them. Each entry
   * links to the field with the `fieldId` id: the id of a control, or of
   * an element that holds one, such as a radio group. An entry without a
   * `fieldId` is listed as text. The summary is not rendered while the
   * list is empty.
   * @type {ReadonlyArray<ErrorSummaryItem>}
   */
  export let errors = [];

  /**
   * Specify the heading text, such as "Fix 3 errors".
   * It names the summary for screen readers.
   */
  export let title = "There is a problem";

  /**
   * Specify text to show under the heading.
   * @type {string}
   */
  export let description = "";

  /**
   * Specify the level of the heading, so it fits the page's outline.
   * @type {2 | 3 | 4 | 5 | 6}
   */
  export let headingLevel = 2;

  /**
   * Set to `false` to leave focus where it is when the summary appears.
   * Without focus, the heading and the errors are sent to the page's
   * shared live region, so screen readers still announce them, also when
   * the list changes. Call `focus()` to move focus after a failed submit
   * when the summary is already showing.
   */
  export let focusOnShow = true;

  /**
   * Specify the height, in pixels, of a fixed header to keep clear when a
   * link scrolls the field's label into view.
   */
  export let scrollMargin = 0;

  /**
   * Set an id for the summary element.
   * The heading's id derives from it as `{id}-title`.
   */
  export let id = useId("error-summary");

  /**
   * Obtain a reference to the summary element.
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  /**
   * Move focus to the summary, for a screen reader to read it.
   * Does nothing while there are no errors.
   * @type {(options?: FocusOptions) => void}
   */
  export function focus(options) {
    ref?.focus(options);
  }

  import { afterUpdate, createEventDispatcher, onMount, tick } from "svelte";
  import { createAnnouncerChannel } from "../utils/announcer.js";
  import { useId } from "../utils/id-scope.js";
  import { focusField } from "./focus-field.js";

  const END_PUNCTUATION = /[.!?]$/;

  const dispatch = createEventDispatcher();

  $: shown = errors.length > 0;
  $: titleId = `${id}-title`;

  let wasShown = false;

  // Without focus, the summary is read from the shared live region, or from
  // the dialog it is in: the heading, then each error.
  const status = createAnnouncerChannel(() => ref);
  /** @type {ReadonlyArray<ErrorSummaryItem> | undefined} */
  let announced;

  onMount(() => status.connect());

  /**
   * @param {string} text
   */
  const sentence = (text) => text.trim().replace(END_PUNCTUATION, "");

  // Focus once as the summary appears, or on mount when the server or the
  // first render already has errors. The heading and list are patched after
  // `afterUpdate` in Svelte 5, so wait a tick for `ref`.
  afterUpdate(async () => {
    if (!focusOnShow && shown && errors !== announced) {
      const lines = [title, description, ...errors.map((e) => e.message)];
      status.announce(`${lines.filter(Boolean).map(sentence).join(". ")}.`);
    }
    announced = shown ? errors : undefined;
    if (!shown) status.clear();
    if (shown === wasShown) return;
    wasShown = shown;
    if (shown && focusOnShow) {
      await tick();
      focus();
    }
  });

  /**
   * @param {MouseEvent} event
   * @param {ErrorSummaryItem} error
   * @param {number} index
   */
  function onClick(event, error, index) {
    if (!error.fieldId) return;
    const proceed = dispatch("select", { error, index }, { cancelable: true });
    if (!proceed) {
      event.preventDefault();
      return;
    }
    // A match moves focus here; without one the link navigates to the hash.
    const root = ref?.getRootNode();
    if (
      focusField(error.fieldId, {
        scrollMargin,
        root:
          root instanceof Document || root instanceof ShadowRoot
            ? root
            : undefined,
      })
    ) {
      event.preventDefault();
    }
  }
</script>

{#if shown}
  <div
    bind:this={ref}
    {id}
    class:bx--error-summary={true}
    role="group"
    aria-labelledby={$$restProps["aria-label"] ? undefined : titleId}
    tabindex="-1"
    {...$$restProps}
  >
    <svelte:element
      this={`h${headingLevel}`}
      id={titleId}
      class="bx--error-summary__title"
    >
      {title}
    </svelte:element>
    {#if description}
      <p class:bx--error-summary__description={true}>{description}</p>
    {/if}
    <ul class:bx--error-summary__list={true}>
      {#each errors as error, index (error)}
        <li>
          {#if error.fieldId}
            <a
              href="#{error.fieldId}"
              class:bx--link={true}
              class:bx--error-summary__link={true}
              on:click={(event) => onClick(event, error, index)}
              >{error.message}</a
            >
          {:else}
            {error.message}
          {/if}
        </li>
      {/each}
    </ul>
  </div>
{/if}
