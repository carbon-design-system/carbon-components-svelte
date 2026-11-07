// Leak checks: what a test leaves registered on the page once its
// components are gone. A listener on the window, the document, `<html>` or
// `<body>` outlives the component that added it, and so does a
// MutationObserver watching a node that's still in the document; either one
// keeps the component's closures alive and keeps running.
//
// `mark()` before a test and `check(mark)` after its cleanup list what was
// added in between and is still there, with the line that added it.

let enabled = false;
let seq = 0;
let bundleFile = "\0";
/** Listeners and observations on long-lived targets, in order added. */
let tracked = [];

export function enable() {
  enabled = true;
  bundleFile =
    /\(?(\/[^\s()]+?):\d+:\d+\)?/.exec(
      new Error().stack?.split("\n")[1] ?? "",
    )?.[1] ?? "\0";
}

/**
 * The frames outside dom-env and libraries, innermost first, up to four:
 * the component or test code that asked for the registration, past Svelte's
 * runtime, which makes the call for a `<svelte:window on:resize>`, and past
 * helpers such as a shared listener pool. `null` when only libraries asked
 * (testing-library, user-event, Svelte's own event delegation).
 */
function site() {
  const frames = [];
  for (const line of new Error().stack?.split("\n").slice(2) ?? []) {
    if (line.includes(bundleFile) || line.includes("node:")) continue;
    const m = /\(?((?:file:\/\/)?\/[^\s()]+:\d+:\d+)\)?\s*$/.exec(line);
    if (m && !m[1].includes("/node_modules/")) frames.push(m[1]);
    if (frames.length === 4) break;
  }
  return frames.length ? frames.join(" <- ") : null;
}

/** The window, a document, `<html>` and `<body>`: targets that outlive a test. */
function longLived(target) {
  if (target === globalThis) return true;
  const type = target.nodeType;
  if (type === 9) return true;
  return (
    type === 1 && (target._localName === "body" || target._localName === "html")
  );
}

function name(target) {
  if (target === globalThis) return "window";
  if (target.nodeType === 9) return "document";
  return target._localName ?? target.nodeName?.toLowerCase() ?? "node";
}

// Entries hold what they track weakly: a removed listener's callback, or
// an observer and the node it watched, must stay collectable, or the check
// would keep alive what a test asserts the library lets go of.

/** Called by `addEventListener` with the listener record it stored. */
export function trackListener(target, type, listener) {
  if (!enabled || !longLived(target)) return;
  const at = site();
  if (at)
    tracked.push({
      kind: "listener",
      seq: ++seq,
      what: `${type} listener on ${name(target)}`,
      listener: new WeakRef(listener),
      at,
    });
}

/** Called by `MutationObserver#observe` for a new registration. */
export function trackObservation(observer, target) {
  if (!enabled) return;
  const at = site();
  if (at)
    tracked.push({
      kind: "observer",
      seq: ++seq,
      what: `MutationObserver on ${name(target)}`,
      observer: new WeakRef(observer),
      target: new WeakRef(target),
      at,
    });
}

function live(entry) {
  if (entry.kind === "listener") {
    const listener = entry.listener.deref();
    return !!listener && !listener.removed;
  }
  const observer = entry.observer.deref();
  const target = entry.target.deref();
  return (
    !!observer &&
    !!target &&
    (target.isConnected || target.nodeType === 9) &&
    !!target._regs?.some((r) => r.observer === observer)
  );
}

/** A point to check from: registrations after it are the test's. */
export function mark() {
  // Drop what's gone, so the list stays as long as what's live.
  tracked = tracked.filter(live);
  return seq;
}

/**
 * What was registered after `from` and is still live, from code whose file
 * path includes `include` (a test's own listeners are its business).
 */
export function since(from, include = "") {
  return tracked
    .filter(
      (e) => e.seq > from && e.at.split(" <- ")[0].includes(include) && live(e),
    )
    .map(({ what, at }) => ({ what, at }));
}

export function isEnabled() {
  return enabled;
}
