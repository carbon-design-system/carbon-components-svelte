/**
 * Mounts the rest of a page's examples when idle, so the browser's Find
 * sees them and a fast scroll doesn't reach empty placeholders.
 */
type Pending = { element: HTMLElement; mount: () => void };

const queue = new Set<Pending>();
let scheduled = false;

/** Left for the layout the mount causes, which runs next frame. */
const IDLE_RESERVE_MS = 8;

/** Safari has no `requestIdleCallback`. */
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

/** `mount` must render before it returns, to count against the idle period. */
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
  // Skip content above the viewport: mounting it would move what's on
  // screen, and Safari doesn't anchor the scroll to make up for it.
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
