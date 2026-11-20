<script>
  /**
   * @restProps {div}
   * @slot {{}} - The tip's text.
   * @slot {{}} illustration - Decorative art beside the text, hidden from assistive technology.
   * @slot {{}} actions - Actions after the "Learn more" link, such as a `Button`.
   * @event {{ id: string | undefined }} dismiss - Fires when the dismiss button is pressed. Call `preventDefault()` to keep the tip.
   * @event {{ collapsed: boolean }} toggle - Fires when the tip collapses or expands.
   */

  /**
   * Specify the tip's id. It is the tip's name in the tip store, so a
   * dismissal is remembered by it, and the DOM id, with the title and
   * content ids derived from it. A tip without an `id` is dismissed
   * for the life of the component only.
   * @type {string | undefined}
   */
  export let id = undefined;

  /**
   * Specify the title. It names the tip's region and its dismiss button, and
   * it is the one line a collapsed tip keeps.
   */
  export let title = "";

  /**
   * Set to `true` to let users collapse the tip to its title. The title
   * becomes the button that does it.
   */
  export let collapsible = false;

  /**
   * Set to `true` to collapse the tip to its title. Has no effect unless
   * `collapsible` is `true`.
   * @bindable writable
   */
  export let collapsed = false;

  /** Set to `false` to hide the dismiss button. */
  export let dismissible = true;

  /**
   * Specify a "Learn more" link. It is described by the title.
   * @type {string | undefined}
   */
  export let href = undefined;

  /** Specify the text of the "Learn more" link. */
  export let learnMoreText = "Learn more";

  /**
   * Override the label of the dismiss button, which also reads the tip's
   * title.
   * @type {(title: string) => string}
   */
  export let dismissText = defaultDismissText;

  /**
   * Specify the heading level of the title, to fit the page outline.
   * Inside a `Section`, defaults to one level below the section's heading;
   * otherwise to 3.
   * @type {1 | 2 | 3 | 4 | 5 | 6 | undefined}
   */
  export let headingLevel = undefined;

  /**
   * Provide the tip store that remembers the dismissal. Defaults to the store
   * `setTipStore` shared, then to a store of the page's own in
   * `localStorage`.
   * @type {import("../utils/tip-store.js").TipStore | undefined}
   */
  export let store = undefined;

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import Link from "../Link/Link.svelte";
  import ChevronDown from "../icons/ChevronDown.svelte";
  import Close from "../icons/Close.svelte";
  import Idea from "../icons/Idea.svelte";
  import { returnFocus } from "../utils/focus.js";
  import { createTipStoreBinding } from "../utils/tip-store.js";
  import { uniqueId } from "../utils/unique-id.js";

  /** @param {string} title */
  function defaultDismissText(title) {
    return title ? `Dismiss tip: ${title}` : "Dismiss tip";
  }

  const dispatch = createEventDispatcher();
  const fallbackId = uniqueId();

  // Undefined outside a `Section`; `$sectionLevel` is read only when it is set.
  /** @type {import("svelte/store").Readable<1 | 2 | 3 | 4 | 5 | 6>} */
  const sectionLevel = getContext("carbon:Section");

  /** @type {null | HTMLDivElement} */
  let ref = null;

  /** @type {null | HTMLElement} */
  let prevFocus = null;

  let mounted = false;
  let dismissedHere = false;

  const binding = createTipStoreBinding();

  onMount(() => {
    mounted = true;
    return binding.release;
  });

  $: tips = binding.resolve(store);
  $: if (mounted) binding.connect(tips, id !== undefined);

  $: tipId = id ?? fallbackId;
  $: titleId = `${tipId}-title`;
  $: contentId = `${tipId}-content`;
  $: headingTag = `h${
    headingLevel ?? (sectionLevel ? Math.min($sectionLevel + 1, 6) : 3)
  }`;
  $: isCollapsed = collapsible && !!title && collapsed;

  // Without an id nothing remembers the dismissal, and with one the store's
  // `pending` decides what the server and the first client paint show.
  $: visible =
    !dismissedHere &&
    (id === undefined ||
      ($tips.ready ? !$tips.dismissed.has(id) : $tips.pending === "show"));

  /** @param {FocusEvent} event */
  function handleFocusin(event) {
    const from = event.relatedTarget;
    if (!(from instanceof Node && ref?.contains(from))) {
      prevFocus = from instanceof HTMLElement ? from : null;
    }
  }

  function handleDismiss() {
    if (!dispatch("dismiss", { id }, { cancelable: true })) return;
    const region = ref;
    const restore = region?.contains(document.activeElement) ? prevFocus : null;
    if (id === undefined) {
      dismissedHere = true;
    } else {
      tips.dismiss(id);
    }
    // The tip unmounts, so focus would fall to the page. Put it back where it
    // was before it entered the tip.
    tick().then(() => returnFocus(restore, region));
  }

  function handleToggle() {
    collapsed = !collapsed;
    dispatch("toggle", { collapsed });
  }
</script>

{#if visible}
  <div
    role="region"
    aria-labelledby={title && !$$restProps["aria-label"] ? titleId : undefined}
    {...$$restProps}
    id={tipId}
    bind:this={ref}
    class:bx--inline-tip={true}
    class:bx--inline-tip--collapsible={collapsible}
    class:bx--inline-tip--collapsed={isCollapsed}
    on:focusin={handleFocusin}
  >
    <div class:bx--inline-tip__icon={true} aria-hidden="true">
      <Idea size={20} />
    </div>
    <div class:bx--inline-tip__main={true}>
      {#if title}
        <svelte:element this={headingTag} class:bx--inline-tip__heading={true}>
          {#if collapsible}
            <button
              type="button"
              id={titleId}
              class:bx--inline-tip__toggle={true}
              aria-expanded={!isCollapsed}
              aria-controls={contentId}
              on:click={handleToggle}
            >
              <span class:bx--inline-tip__title={true}>{title}</span>
              <ChevronDown class="bx--inline-tip__chevron" />
            </button>
          {:else}
            <span id={titleId} class:bx--inline-tip__title={true}>{title}</span>
          {/if}
        </svelte:element>
      {/if}
      <div id={contentId} class:bx--inline-tip__body={true}>
        <div class:bx--inline-tip__body-inner={true}>
          <div class:bx--inline-tip__content={true}>
            <slot />
          </div>
          {#if href || $$slots.actions}
            <div class:bx--inline-tip__actions={true}>
              {#if href}
                <Link {href} size="sm" aria-describedby={titleId}>
                  {learnMoreText}
                </Link>
              {/if}
              <slot name="actions" />
            </div>
          {/if}
        </div>
      </div>
    </div>
    {#if $$slots.illustration}
      <div class:bx--inline-tip__illustration={true} aria-hidden="true">
        <slot name="illustration" />
      </div>
    {/if}
    {#if dismissible}
      <button
        type="button"
        class:bx--inline-tip__close={true}
        aria-label={dismissText(title)}
        title={dismissText(title)}
        on:click={handleDismiss}
      >
        <Close size={16} />
      </button>
    {/if}
  </div>
{/if}
