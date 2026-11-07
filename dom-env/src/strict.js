// Strict mode: records where a test or the code under test reaches past what
// dom-env implements, so a gap shows up as a report instead of a silent
// `undefined` or an expando.
//
// Members: a Proxy sits at the end of every DOM prototype chain, between the
// root prototype and `Object.prototype`. Implemented members resolve before
// it, so it sees only the lookups that miss: reads, and writes (which still
// create the expando).
//
// CSS: style writes and reads of a property name dom-env doesn't know.

let gaps = null;
let bundleFile = "\0";
let ours = null;

/** Private expandos (`_x`, `$$x`, `__click`), indexes, symbols. */
function ignored(key) {
  return typeof key !== "string" || !/^[A-Za-z]\w*$/.test(key);
}

/**
 * Where the lookup came from: the first stack frame outside dom-env, or
 * `null` when that frame is a library's. Libraries probe for what browsers
 * lack and handle its absence (testing-library reading `labels` on a div),
 * so only lookups made by tests and the code under test count. `from` is
 * the frame to start at; a member lookup starts at the code that made it,
 * so dom-env's own reads (an event's init dictionary) don't count.
 */
function site(from) {
  const lines = new Error().stack?.split("\n") ?? [];
  if (from > 1 && lines[from]?.includes(bundleFile)) return null;
  for (const line of lines.slice(from)) {
    if (line.includes(bundleFile)) continue;
    if (/\(native[:)]|^\s*at native/.test(line)) continue;
    const m = /\(?((?:file:\/\/)?\/[^\s()]+:\d+:\d+)\)?\s*$/.exec(line);
    // Libraries' frames: in node_modules, or, as vitest's vmThreads pool
    // on Bun loads them, without a file at all (`unknown:84:41`).
    if (!m || m[1].includes("/node_modules/")) return null;
    return m[1];
  }
  return null;
}

/** Records one gap: `kind` is `get`, `set` or `css`. */
export function report(kind, name, from = 1) {
  if (!gaps) return;
  const id = `${kind} ${name}`;
  const gap = gaps.get(id);
  if (gap) {
    gap.count++;
    return;
  }
  const at = site(from);
  if (at) gaps.set(id, { kind, name, count: 1, at });
}

export function enabled() {
  return gaps !== null;
}

/**
 * The interface a lookup missed on, or `null` to leave it out: objects of
 * other classes (chai's and user-event's subclasses of `Event` and
 * `EventTarget` carry fields of their own), and prototypes, which is how
 * setup code polyfills (`if (!Element.prototype.x) Element.prototype.x =`).
 * Writes to the window define globals.
 */
function owner(kind, receiver) {
  if (receiver === globalThis) return kind === "get" ? "window" : null;
  if (Object.hasOwn(receiver, "constructor")) return null;
  const ctor = receiver.constructor;
  return ours.has(ctor) ? ctor.name : null;
}

function miss(kind, key, receiver) {
  if (ignored(key) || key in Object.prototype) return;
  const name = owner(kind, receiver);
  // Frames: Error, site, report, miss, the trap, then the lookup's code.
  if (name) report(kind, `${name}.${key}`, 5);
}

/** Puts the reporting Proxy at the end of each class's prototype chain. */
export function enable(classes) {
  gaps = new Map();
  ours = new Set(Object.values(classes));
  bundleFile =
    /\(?(\/[^\s()]+?):\d+:\d+\)?/.exec(
      new Error().stack?.split("\n")[1] ?? "",
    )?.[1] ?? "\0";
  const tail = new Proxy(Object.create(Object.prototype), {
    get(target, key, receiver) {
      miss("get", key, receiver);
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
      miss("set", key, receiver);
      return Reflect.set(target, key, value, receiver);
    },
  });
  const roots = new Set();
  for (const ctor of ours) {
    let proto = ctor.prototype;
    while (proto && Object.getPrototypeOf(proto) !== Object.prototype)
      proto = Object.getPrototypeOf(proto);
    if (proto) roots.add(proto);
  }
  for (const root of roots) Object.setPrototypeOf(root, tail);
}

/**
 * The gaps recorded, most frequent first. A global read that setup code
 * then defined (`if (!window.matchMedia) window.matchMedia = ...`) is a
 * polyfill, not a gap.
 */
export function collect() {
  if (!gaps) return [];
  return [...gaps.values()]
    .filter(
      (gap) =>
        !(gap.name.startsWith("window.") && gap.name.slice(7) in globalThis),
    )
    .sort((a, b) => b.count - a.count);
}
