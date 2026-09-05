export type CarouselResponse = {
  currentIndex: number;
  previousIndex: number;
  totalViews: number;
};

export type CarouselConfig = {
  onViewChangeStart?: (response: CarouselResponse) => void;
  onViewChangeEnd?: (response: CarouselResponse) => void;
  /**
   * Size the container to the tallest view instead of the active view's own
   * height, so switching views does not resize the container.
   */
  useMaxHeight?: boolean;
};

export type Carousel = {
  next: () => void;
  prev: () => void;
  goToIndex: (index: number) => void;
  reset: () => void;
  getActiveItem: () => { index: number; item: HTMLElement | null };
  destroyEvents: () => void;
};

/**
 * Drive a container's direct element children as a single-active-view
 * carousel. Ported from `@carbon/utilities`' `initCarousel`, which
 * `InterstitialScreen` uses to page through steps.
 */
export function initCarousel(
  container: HTMLElement,
  config?: CarouselConfig,
): Carousel;
