/**
 * Marks an element with `data-offscreen` while it's well outside the
 * viewport, so its styles can pause what it would otherwise keep doing
 * unseen, such as a live example's looping loading animations. One
 * observer serves every element.
 */

/** How far outside the viewport counts as off screen. */
const MARGIN = "200px 0px";

let observer: IntersectionObserver | undefined;

function shared(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        entry.target.toggleAttribute("data-offscreen", !entry.isIntersecting);
      }
    },
    { rootMargin: MARGIN },
  );
  return observer;
}

/**
 * Keeps `element`'s `data-offscreen` up to date, until the returned
 * function is called.
 */
export function markOffscreen(element: Element): () => void {
  if (typeof IntersectionObserver === "undefined") return () => {};
  const observer = shared();
  observer.observe(element);
  return () => {
    observer.unobserve(element);
    element.removeAttribute("data-offscreen");
  };
}
