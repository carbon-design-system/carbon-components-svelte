<script>
  /**
   * A bar with the size of a selection and the actions on it, for a
   * selection outside DataTable. It shows while `count` is above zero.
   *
   * @event {{ count: number }} clear - Dispatched when the clear button is clicked. Set the selection to empty; the bar hides when `count` reaches zero.
   * @slot {{}} actions - Buttons that act on the selection, before the clear button. Use the default `primary` kind, as in DataTable's batch actions.
   * @slot {{}} items - What is selected, such as a `Tag` for each item, in a row under the bar.
   * @restProps {div}
   */

  /**
   * Specify the number of selected items. The bar shows while it is above
   * zero, and announces it to screen readers when it changes.
   */
  export let count = 0;

  /**
   * Override the text for the number of selected items. It shows at the
   * start of the bar, names the bar, and is announced when `count` changes.
   * @type {(count: number) => string}
   */
  export let selectedText = defaultSelectedText;

  /** Specify the text of the clear button */
  export let clearText = "Clear selection";

  /**
   * Set where the bar renders. `"content"` keeps it in the page where you
   * place it, above or below the content it acts on. `"viewport-end"` pins
   * it to the bottom of the viewport, over the page.
   * @type {"content" | "viewport-end"}
   */
  export let placement = "content";

  /**
   * Animate the bar as it shows and hides. Set to `true` for a slide that
   * moves the content below it (`"content"`) or a rise from the bottom of
   * the viewport (`"viewport-end"`), to params (e.g.,
   * `{ duration: "fast02" }`) to customize it, or to `{ fn }` to use
   * another transition. The bar does not animate by default.
   * @type {import("../motion/resolve-transition.js").TransitionProp<import("../motion/transitions.js").SlideParams & import("../motion/transitions.js").FlyParams>}
   */
  export let transition = undefined;

  /**
   * Specify an element, or a function returning one, to focus when the bar
   * hides with focus inside it, instead of the element focus came from
   * before it entered the bar. A function runs once per hide. Focus returns
   * to that element when it resolves to no element in the page, and stays
   * where it is when that element is gone too, such as a row an action
   * deleted.
   * @type {HTMLElement | (() => HTMLElement | null) | null}
   */
  export let returnFocusTo = null;

  /** Set an id for the bar. Inner ids derive from it. */
  export let id = useId("selection-bar");

  /**
   * Obtain a reference to the bar element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { createEventDispatcher, onMount } from "svelte";
  import { SELECTION_ANNOUNCE_DELAY_MS } from "../constants/timing.js";
  import { resolveTransition } from "../motion/resolve-transition.js";
  import { fly, slide } from "../motion/transitions.js";
  import { createAnnouncerChannel } from "../utils/announcer.js";
  import { returnFocusOnClose } from "../utils/focus.js";
  import { createIdScope, useId } from "../utils/id-scope.js";
  import SelectionBarContent from "./SelectionBarContent.svelte";

  /**
   * @param {number} count
   * @returns {string}
   */
  function defaultSelectedText(count) {
    return `${count} selected`;
  }

  const dispatch = createEventDispatcher();

  // Tags and other items in the slots take their ids from the bar's.
  createIdScope(id);

  $: summaryId = `${id}-summary`;
  $: visible = count > 0;
  $: viewportEnd = placement === "viewport-end";

  $: ({
    fn: transitionFn,
    params: transitionParams,
    animated,
  } = resolveTransition(
    transition,
    viewportEnd ? { fn: fly, params: { y: "100%" } } : { fn: slide },
  ));

  // A consumer `aria-label` names the bar instead of its count.
  $: labelledBy = $$restProps["aria-label"] ? undefined : summaryId;

  const channel = createAnnouncerChannel(() => ref);
  let prevCount = count;

  // Say the count once the selection settles, not on the first render.
  $: if (count !== prevCount) {
    prevCount = count;
    channel.announce(selectedText(count), {
      debounce: SELECTION_ANNOUNCE_DELAY_MS,
    });
  }

  /**
   * Where focus came from before it entered the bar. The clear button, or
   * an action that empties the selection, hides the bar under focus, so
   * focus goes back there unless `returnFocusTo` names another element.
   * @type {null | HTMLElement}
   */
  let returnTarget = null;

  function resolveReturnTarget() {
    const preferred =
      typeof returnFocusTo === "function" ? returnFocusTo() : returnFocusTo;
    return preferred?.isConnected ? preferred : returnTarget;
  }

  /** @param {FocusEvent} event */
  function handleFocusIn(event) {
    const from = event.relatedTarget;
    if (from instanceof HTMLElement && !ref?.contains(from)) {
      returnTarget = from;
    }
  }

  const trackFocus = returnFocusOnClose(resolveReturnTarget, () => ref);
  $: trackFocus(visible);

  function clear() {
    dispatch("clear", { count });
  }

  onMount(() => channel.connect());
</script>

{#if visible && animated}
  <div
    bind:this={ref}
    role="region"
    aria-labelledby={labelledBy}
    class:bx--selection-bar={true}
    class:bx--selection-bar--viewport-end={viewportEnd}
    {...$$restProps}
    transition:transitionFn|local={transitionParams}
    on:focusin={handleFocusIn}
  >
    <SelectionBarContent
      {summaryId}
      text={selectedText(count)}
      {clearText}
      hasItems={!!$$slots.items}
      on:clear={clear}
    >
      <svelte:fragment slot="actions"><slot name="actions" /></svelte:fragment>
      <svelte:fragment slot="items"><slot name="items" /></svelte:fragment>
    </SelectionBarContent>
  </div>
{:else if visible}
  <div
    bind:this={ref}
    role="region"
    aria-labelledby={labelledBy}
    class:bx--selection-bar={true}
    class:bx--selection-bar--viewport-end={viewportEnd}
    {...$$restProps}
    on:focusin={handleFocusIn}
  >
    <SelectionBarContent
      {summaryId}
      text={selectedText(count)}
      {clearText}
      hasItems={!!$$slots.items}
      on:clear={clear}
    >
      <svelte:fragment slot="actions"><slot name="actions" /></svelte:fragment>
      <svelte:fragment slot="items"><slot name="items" /></svelte:fragment>
    </SelectionBarContent>
  </div>
{/if}
