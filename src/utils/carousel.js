// @ts-check

/**
 * @typedef {Object} CarouselResponse
 * @property {number} currentIndex
 * @property {number} previousIndex
 * @property {number} totalViews
 */

/**
 * @typedef {Object} CarouselConfig
 * @property {(response: CarouselResponse) => void} [onViewChangeStart]
 * @property {(response: CarouselResponse) => void} [onViewChangeEnd]
 * @property {boolean} [useMaxHeight] Size the container to the tallest view instead of the active view's own height, so switching views does not resize the container.
 */

/**
 * @typedef {Object} Carousel
 * @property {() => void} next
 * @property {() => void} prev
 * @property {(index: number) => void} goToIndex
 * @property {() => void} reset
 * @property {() => { index: number; item: HTMLElement | null }} getActiveItem
 * @property {() => void} destroyEvents
 */

const activeClass = "carousel__view--active";

/**
 * Drive a container's direct element children as a single-active-view
 * carousel. Ported from `@carbon/utilities`' `initCarousel`, which
 * `InterstitialScreen` uses to page through steps.
 *
 * This keeps upstream's index/callback contract (`goToIndex`/`next`/`prev`/
 * `getActiveItem`, `onViewChangeStart`/`onViewChangeEnd`) but drops its
 * DOM-recycling transition machinery (a stack of in/out CSS classes with no
 * matching shipped SCSS even upstream) in favor of plain `hidden` toggling,
 * since nothing here has motion to drive yet. Swipe/touch support is also
 * not ported: `InterstitialScreen` always disables it upstream too, and
 * nothing else in this repo needs it.
 *
 * @param {HTMLElement} container
 * @param {CarouselConfig} [config]
 * @returns {Carousel}
 */
export function initCarousel(container, config = {}) {
  const { onViewChangeStart, onViewChangeEnd, useMaxHeight = false } = config;

  /** @type {HTMLElement[]} */
  const views = /** @type {HTMLElement[]} */ (Array.from(container.children));

  let currentIndex = 0;

  function measureMaxHeight() {
    if (!useMaxHeight || views.length === 0) return;

    let max = 0;
    for (const view of views) {
      const wasHidden = view.hidden;
      view.hidden = false;
      view.style.position = "absolute";
      view.style.visibility = "hidden";
      max = Math.max(max, view.scrollHeight);
      view.style.position = "";
      view.style.visibility = "";
      view.hidden = wasHidden;
    }
    container.style.minBlockSize = max ? `${max}px` : "";
  }

  function applyVisibility() {
    views.forEach((view, index) => {
      const active = index === currentIndex;
      view.hidden = !active;
      view.classList.toggle(activeClass, active);
    });
    measureMaxHeight();
  }

  /**
   * @param {number} index
   * @param {number} previousIndex
   */
  function response(index, previousIndex) {
    return {
      currentIndex: index,
      previousIndex,
      totalViews: views.length,
    };
  }

  /**
   * @param {number} index
   */
  function goToIndex(index) {
    if (views.length === 0) return;

    const clamped = Math.max(0, Math.min(index, views.length - 1));
    if (clamped === currentIndex) return;

    const previousIndex = currentIndex;
    onViewChangeStart?.(response(clamped, previousIndex));
    currentIndex = clamped;
    applyVisibility();
    onViewChangeEnd?.(response(currentIndex, previousIndex));
  }

  function next() {
    goToIndex(currentIndex + 1);
  }

  function prev() {
    goToIndex(currentIndex - 1);
  }

  function reset() {
    goToIndex(0);
  }

  function getActiveItem() {
    return {
      index: views.length === 0 ? -1 : currentIndex,
      item: views[currentIndex] ?? null,
    };
  }

  function destroyEvents() {
    for (const view of views) {
      view.hidden = false;
      view.classList.remove(activeClass);
    }
    container.style.minBlockSize = "";
  }

  applyVisibility();

  return { next, prev, goToIndex, reset, getActiveItem, destroyEvents };
}
