<script>
  /**
   * @typedef {object} GuidebannerTip
   * @property {string} id The tip's name in the tip store.
   * @property {string} title
   * @property {string} [text]
   * @property {string} [href] A "Learn more" link.
   * @property {string} [learnMoreText] Overrides the banner's `learnMoreText`.
   */

  /**
   * @restProps {div}
   * @slot {{ tip: GuidebannerTip; index: number; total: number }} - Replaces the tip's text and "Learn more" link.
   * @slot {{ tip: GuidebannerTip; index: number; total: number }} illustration - Decorative art beside the tip, hidden from assistive technology.
   * @event {{ index: number; id: string }} change - Fires when the previous or next button shows another tip.
   * @event {{ ids: string[] }} dismiss - Fires when the dismiss button is pressed. Call `preventDefault()` to keep the banner.
   */

  /**
   * Specify the tips, in the order to show them. A tip the store lists as
   * dismissed is skipped, so a tip added later shows up on its own.
   * @type {ReadonlyArray<GuidebannerTip>}
   */
  export let tips = [];

  /**
   * Specify the index of the tip shown, among the tips not dismissed.
   * Out-of-range values are clamped.
   * @bindable writable
   */
  export let current = 0;

  /** Specify the accessible label of the banner's region. */
  export let labelText = "Tips";

  /** Specify the accessible label for the previous-tip button. */
  export let prevButtonLabelText = "Previous tip";

  /** Specify the accessible label for the next-tip button. */
  export let nextButtonLabelText = "Next tip";

  /**
   * Override the label of the button that dismisses every tip.
   * @type {() => string}
   */
  export let dismissText = defaultDismissText;

  /**
   * Override the counter text, which also names each tip for screen readers.
   * @type {(current: number, total: number) => string}
   */
  export let counterText = defaultCounterText;

  /** Specify the text of a tip's "Learn more" link. */
  export let learnMoreText = "Learn more";

  /**
   * Specify the heading level of a tip's title, to fit the page outline.
   * Inside a `Section`, defaults to one level below the section's heading;
   * otherwise to 3.
   * @type {1 | 2 | 3 | 4 | 5 | 6 | undefined}
   */
  export let headingLevel = undefined;

  /**
   * Provide the tip store that remembers the dismissals. Defaults to the
   * store `setTipStore` shared, then to a store of the page's own in
   * `localStorage`.
   * @type {import("../utils/tip-store.js").TipStore | undefined}
   */
  export let store = undefined;

  /**
   * Set an id for the top-level element. The tip's id derives from it as
   * `{id}-tip`.
   * @type {string | undefined}
   */
  export let id = undefined;

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import Link from "../Link/Link.svelte";
  import ChevronLeft from "../icons/ChevronLeft.svelte";
  import ChevronRight from "../icons/ChevronRight.svelte";
  import Close from "../icons/Close.svelte";
  import Idea from "../icons/Idea.svelte";
  import { returnFocus } from "../utils/focus.js";
  import { createTipStoreBinding } from "../utils/tip-store.js";
  import { uniqueId } from "../utils/unique-id.js";

  function defaultDismissText() {
    return "Dismiss all tips";
  }

  /**
   * @param {number} current
   * @param {number} total
   */
  function defaultCounterText(current, total) {
    return `${current} of ${total}`;
  }

  const dispatch = createEventDispatcher();
  const fallbackId = uniqueId();
  const binding = createTipStoreBinding();

  // Undefined outside a `Section`; `$sectionLevel` is read only when it is set.
  /** @type {import("svelte/store").Readable<1 | 2 | 3 | 4 | 5 | 6>} */
  const sectionLevel = getContext("carbon:Section");

  /** @type {null | HTMLDivElement} */
  let ref = null;

  /** @type {null | HTMLElement} */
  let prevFocus = null;

  let mounted = false;
  let interacted = false;

  onMount(() => {
    mounted = true;
    return binding.release;
  });

  $: tipStore = binding.resolve(store);
  $: if (mounted) binding.connect(tipStore, tips.length > 0);

  /**
   * The tips left to show. Until the store has read its storage, the store's
   * `pending` decides: none, or all of them.
   * @param {ReadonlyArray<GuidebannerTip>} list
   * @param {import("../utils/tip-store.js").TipStoreState} state
   * @returns {ReadonlyArray<GuidebannerTip>}
   */
  function remainingTips(list, state) {
    if (!state.ready) return state.pending === "show" ? list : [];
    return list.filter((tip) => !state.dismissed.has(tip.id));
  }

  $: remaining = remainingTips(tips, $tipStore);
  $: total = remaining.length;
  $: index = Math.max(0, Math.min(Math.floor(Number(current) || 0), total - 1));
  $: tip = remaining[index];
  $: bannerId = id ?? fallbackId;
  $: headingTag = `h${
    headingLevel ?? (sectionLevel ? Math.min($sectionLevel + 1, 6) : 3)
  }`;

  /** @param {1 | -1} step */
  function navigate(step) {
    current = (index + step + total) % total;
    dispatch("change", { index: current, id: remaining[current].id });
  }

  /** @param {FocusEvent} event */
  function handleFocusin(event) {
    interacted = true;
    const from = event.relatedTarget;
    if (!(from instanceof Node && ref?.contains(from))) {
      prevFocus = from instanceof HTMLElement ? from : null;
    }
  }

  function handleDismiss() {
    const ids = tips.map((item) => item.id);
    if (!dispatch("dismiss", { ids }, { cancelable: true })) return;
    const region = ref;
    const restore = region?.contains(document.activeElement) ? prevFocus : null;
    tipStore.dismiss(ids);
    // The banner unmounts, so focus would fall to the page. Put it back where
    // it was before it entered the banner.
    tick().then(() => returnFocus(restore, region));
  }
</script>

{#if tip}
  <div
    role="region"
    aria-roledescription="carousel"
    aria-label={labelText}
    {...$$restProps}
    id={bannerId}
    bind:this={ref}
    class:bx--inline-tip={true}
    class:bx--guidebanner={true}
    on:focusin={handleFocusin}
    on:pointerdown={() => {
      interacted = true;
    }}
  >
    <div class:bx--inline-tip__icon={true} aria-hidden="true">
      <Idea size={20} />
    </div>
    <!--
      A polite live region announces the tip a button moved to. It stays off
      until the user reaches the banner, so a tip that appears on its own is
      not announced.
    -->
    <div
      id="{bannerId}-tip"
      class:bx--inline-tip__main={true}
      aria-live={interacted ? "polite" : "off"}
    >
      <div
        class:bx--guidebanner__slide={true}
        role="group"
        aria-roledescription="slide"
        aria-label={counterText(index + 1, total)}
      >
        <slot {tip} {index} {total}>
          <svelte:element
            this={headingTag}
            class:bx--inline-tip__heading={true}
          >
            <span class:bx--inline-tip__title={true}>{tip.title}</span>
          </svelte:element>
          {#if tip.text}
            <div class:bx--inline-tip__content={true}>{tip.text}</div>
          {/if}
          {#if tip.href}
            <div class:bx--inline-tip__actions={true}>
              <Link href={tip.href} size="sm">
                {tip.learnMoreText || learnMoreText}
              </Link>
            </div>
          {/if}
        </slot>
      </div>
    </div>
    {#if $$slots.illustration}
      <div class:bx--inline-tip__illustration={true} aria-hidden="true">
        <slot name="illustration" {tip} {index} {total} />
      </div>
    {/if}
    <div class:bx--guidebanner__controls={true}>
      {#if total > 1}
        <span class:bx--carousel__counter={true}>
          {counterText(index + 1, total)}
        </span>
        <button
          type="button"
          class:bx--carousel__button={true}
          aria-label={prevButtonLabelText}
          aria-controls="{bannerId}-tip"
          on:click={() => navigate(-1)}
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          class:bx--carousel__button={true}
          aria-label={nextButtonLabelText}
          aria-controls="{bannerId}-tip"
          on:click={() => navigate(1)}
        >
          <ChevronRight />
        </button>
      {/if}
      <button
        type="button"
        class:bx--inline-tip__close={true}
        aria-label={dismissText()}
        title={dismissText()}
        on:click={handleDismiss}
      >
        <Close size={16} />
      </button>
    </div>
  </div>
{/if}
