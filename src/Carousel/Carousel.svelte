<script>
  /**
   * @event {{ currentIndex: number; previousIndex: number; totalViews: number }} change
   * @restProps {div}
   * @slot {{}}
   */

  /**
   * Specify the active slide index.
   * Out-of-range values are clamped to the first or last slide.
   * @bindable writable
   */
  export let selectedIndex = 0;

  /** Specify the accessible label for the carousel region. */
  export let labelText = "Carousel";

  /** Specify the accessible label for the previous-slide button. */
  export let prevButtonLabelText = "Previous slide";

  /** Specify the accessible label for the next-slide button. */
  export let nextButtonLabelText = "Next slide";

  /**
   * Set to `false` to size the viewport to each active slide's own height
   * instead of the tallest slide.
   */
  export let useMaxHeight = true;

  /**
   * Set to `true` to wrap around: next on the last slide goes to the first,
   * and previous on the first slide goes to the last. Applies to the buttons
   * and arrow keys; a bound `selectedIndex` is still clamped.
   */
  export let wrap = false;

  /**
   * Set to `true` to show the active slide's position next to the buttons.
   * Pair it with `wrap`, where the buttons no longer disable at the bounds.
   */
  export let showCounter = false;

  /**
   * Override the counter text.
   * @type {(current: number, total: number) => string}
   */
  export let counterText = (current, total) => `${current} of ${total}`;

  import {
    afterUpdate,
    createEventDispatcher,
    onMount,
    setContext,
    tick,
  } from "svelte";
  import { writable } from "svelte/store";
  import ChevronLeft from "../icons/ChevronLeft.svelte";
  import ChevronRight from "../icons/ChevronRight.svelte";
  import { initCarousel } from "../utils/carousel.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();
  const viewportId = uniqueId();

  /** @type {import("svelte/store").Writable<Element[]>} */
  const views = writable([]);
  setContext("carbon:Carousel", { views });

  let viewportRef = null;
  let prevButton = null;
  let nextButton = null;
  let mounted = false;
  let currentIndex = 0;
  /** @type {import("../utils/carousel.js").Carousel | null} */
  let carousel = null;
  let appliedUseMaxHeight = useMaxHeight;
  // Set while restoring the index after (re-)initializing, so only real
  // navigation dispatches `change`.
  let silent = false;

  function syncIndex() {
    currentIndex = Math.max(0, carousel?.getActiveItem().index ?? 0);
    selectedIndex = currentIndex;
  }

  /** @param {number} index */
  function goTo(index) {
    carousel?.goToIndex(index);
    // `goToIndex` clamps; reflect a clamped value back into `selectedIndex`.
    syncIndex();
  }

  function childrenChanged() {
    const children = viewportRef.children;
    return (
      children.length !== $views.length ||
      $views.some((view, index) => view !== children[index])
    );
  }

  // `initCarousel` snapshots the container's children, so it is re-created
  // whenever a slide is added, removed, or reordered.
  function setup() {
    carousel?.destroyEvents();
    carousel = null;
    if (!viewportRef) return;

    const children = Array.from(viewportRef.children);
    const previousIndex = currentIndex;
    views.set(children);
    appliedUseMaxHeight = useMaxHeight;
    carousel = initCarousel(viewportRef, {
      useMaxHeight,
      onViewChangeEnd: (detail) => {
        if (!silent) dispatch("change", detail);
      },
    });

    silent = true;
    goTo(selectedIndex);
    silent = false;

    // The rebuilt carousel starts at 0, so compare against the index before
    // the rebuild: a clamped or newly selected slide is a real change.
    if (mounted && currentIndex !== previousIndex) {
      dispatch("change", {
        currentIndex,
        previousIndex,
        totalViews: children.length,
      });
    }
  }

  onMount(() => {
    setup();
    mounted = true;

    // Catches slide changes that do not update this component itself.
    const observer = new MutationObserver(() => {
      if (childrenChanged()) setup();
    });
    observer.observe(viewportRef, { childList: true });

    return () => {
      observer.disconnect();
      carousel?.destroyEvents();
      carousel = null;
    };
  });

  // Runs after the DOM update, so a slide added in the same update as a
  // `selectedIndex` pointing at it is already in the viewport.
  afterUpdate(() => {
    if (!mounted) return;
    if (useMaxHeight !== appliedUseMaxHeight || childrenChanged()) setup();
    else if (selectedIndex !== currentIndex) goTo(selectedIndex);
  });

  $: atStart = !wrap && currentIndex <= 0;
  $: atEnd = !wrap && currentIndex >= $views.length - 1;
  $: prevDisabled = $views.length <= 1 || atStart;
  $: nextDisabled = $views.length <= 1 || atEnd;

  /** @param {1 | -1} step */
  async function navigate(step) {
    const focused = document.activeElement;
    const total = $views.length;
    const target = currentIndex + step;
    goTo(wrap && total > 0 ? (target + total) % total : target);
    await tick();

    // Clicking a button up to a bound disables it; hand focus to the other
    // button instead of letting it drop to `<body>`.
    if (focused === prevButton && prevDisabled && !nextDisabled) {
      nextButton?.focus();
    } else if (focused === nextButton && nextDisabled && !prevDisabled) {
      prevButton?.focus();
    }
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (event.defaultPrevented) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    // Leave arrow keys to slide content that uses them.
    const target = /** @type {HTMLElement} */ (event.target);
    if (
      target.isContentEditable ||
      target.closest(
        "input, textarea, select, [role='slider'], [role='listbox'], [role='tablist']",
      )
    ) {
      return;
    }

    event.preventDefault();
    navigate(event.key === "ArrowLeft" ? -1 : 1);
  }
</script>

<div
  {...$$restProps}
  class:bx--carousel={true}
  role="region"
  aria-roledescription="carousel"
  aria-label={labelText}
  on:keydown={handleKeydown}
>
  <div
    bind:this={viewportRef}
    id={viewportId}
    class:bx--carousel__viewport={true}
    aria-live="polite"
  >
    <slot />
  </div>
  <div class:bx--carousel__controls={true}>
    {#if showCounter && $views.length > 0}
      <span class:bx--carousel__counter={true}>
        {counterText(currentIndex + 1, $views.length)}
      </span>
    {/if}
    <button
      bind:this={prevButton}
      type="button"
      class:bx--carousel__button={true}
      class:bx--carousel__button--previous={true}
      aria-label={prevButtonLabelText}
      aria-controls={viewportId}
      disabled={prevDisabled}
      on:click={() => navigate(-1)}
    >
      <ChevronLeft />
    </button>
    <button
      bind:this={nextButton}
      type="button"
      class:bx--carousel__button={true}
      class:bx--carousel__button--next={true}
      aria-label={nextButtonLabelText}
      aria-controls={viewportId}
      disabled={nextDisabled}
      on:click={() => navigate(1)}
    >
      <ChevronRight />
    </button>
  </div>
</div>
