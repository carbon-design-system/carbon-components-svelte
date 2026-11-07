/**
 * A page mounts its live examples, and its API section, as they near the
 * viewport. Once the browser is idle, this mounts the rest, top to bottom,
 * a few at a time, so the browser's Find sees them and a fast scroll
 * doesn't reach empty placeholders.
 */
type Pending = { element: HTMLElement; mount: () => void };

const queue = new Set<Pending>();
let scheduled = false;

/**
 * How much of an idle period to leave unused: mounting changes the
 * layout, which the browser works out in the next frame.
 */
const IDLE_RESERVE_MS = 8;

/**
 * Safari has no `requestIdleCallback`, so there an idle period is a fixed
 * budget after a pause long enough for the page to settle and to scroll.
 */
const FALLBACK_PAUSE_MS = 250;
const FALLBACK_BUDGET_MS = 16;

type Deadline = Pick<IdleDeadline, "timeRemaining">;

const whenIdle: (callback: (deadline: Deadline) => void) => void =
  typeof requestIdleCallback === "function"
    ? (callback) => requestIdleCallback(callback)
    : (callback) =>
        setTimeout(() => {
          const end = performance.now() + FALLBACK_BUDGET_MS;
          callback({ timeRemaining: () => end - performance.now() });
        }, FALLBACK_PAUSE_MS);

/**
 * Queues content, whose wrapper is `element`, to be mounted by `mount` when
 * the browser is idle. `mount` renders it before returning, so the time it
 * takes counts against the idle period. Returns a function that takes it
 * off the queue, for when it mounts first or the page goes away.
 */
export function queueIdleMount(
  element: HTMLElement,
  mount: () => void,
): () => void {
  const pending = { element, mount };
  queue.add(pending);
  schedule();
  return () => queue.delete(pending);
}

function schedule() {
  if (scheduled || queue.size === 0) return;
  scheduled = true;
  whenIdle(run);
}

function run(deadline: Deadline) {
  scheduled = false;
  // Read where the content is once, before mounting changes the layout.
  // Content above the viewport stays until the reader scrolls near it:
  // mounting it would change its height and move what's on screen, and
  // Safari doesn't anchor the scroll to make up for it.
  const below: Pending[] = [];
  for (const pending of queue) {
    if (pending.element.getBoundingClientRect().bottom < 0) {
      queue.delete(pending);
    } else {
      below.push(pending);
    }
  }
  for (const pending of below) {
    if (deadline.timeRemaining() <= IDLE_RESERVE_MS) break;
    queue.delete(pending);
    pending.mount();
  }
  schedule();
}
