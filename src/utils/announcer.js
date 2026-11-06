// @ts-check
import { isModalDialog } from "./modal-dialog.js";
import { uniqueId } from "./unique-id.js";

/**
 * One announcer per document: a polite and an assertive live region, created
 * on the client and shared by every component that has something to say.
 *
 * - A message is a new element in the region, not new text in a fixed
 *   element. The same words twice in a row are two additions, so a screen
 *   reader says both, and no zero-width tail or empty-then-set tick is needed.
 * - Each message belongs to a channel. A newer message on a channel replaces
 *   one that has not been spoken yet, so "12 results" then "9 results" says 9.
 * - The region leaves when the last consumer does, and is created again on
 *   the next message. Inside an open modal dialog it moves into the dialog,
 *   since the rest of the page is out of the accessibility tree there.
 * - Nothing here touches `document` at import. On the server every call is
 *   a no-op.
 */

/** Time (ms) a message stays in its region before it is removed. */
export const ANNOUNCER_CLEAR_AFTER_MS = 7000;

/**
 * Time (ms) a message waits when it is the reason a region was made. A screen
 * reader hears a live region change only after it has seen the region, so
 * text written the moment the region is created is often lost. A region made
 * for a holder (`acquireAnnouncer`, `<Announcer />`) takes messages at once:
 * it was in the page before anyone had something to say.
 */
export const ANNOUNCER_READY_DELAY_MS = 150;

/** Most messages one region holds. The oldest is dropped past this. */
const MAX_MESSAGES = 12;

/** @typedef {"polite" | "assertive"} AnnouncerPoliteness */

/**
 * @typedef {Object} AnnounceOptions
 * @property {AnnouncerPoliteness} [politeness="polite"] - `"assertive"` interrupts what the reader is saying. Use it for a failure the person must act on.
 * @property {string} [channel="default"] - A source of messages. A newer message on a channel replaces one that has not been spoken yet.
 * @property {number} [debounce=0] - Wait this long (ms) after the last message on the channel, then say the latest.
 * @property {number} [throttle=0] - Say at most one message per this many ms on the channel: the first at once, then the latest after the gap.
 * @property {boolean} [dedupe=false] - Skip a message equal to the channel's last one while that one is still in the region.
 * @property {number} [clearAfter=7000] - Remove the message from the region after this many ms.
 * @property {Element | null} [source] - The element the message is about. Inside an open modal dialog, the message goes into the dialog.
 */

/**
 * @typedef {Object} Channel
 * @property {string} id
 * @property {{ message: string, options: AnnounceOptions } | undefined} pending
 * @property {ReturnType<typeof setTimeout> | undefined} timer
 * @property {number} lastAt - When the channel last wrote, 0 for never.
 * @property {string | undefined} lastMessage - The text still in the region.
 * @property {Message | undefined} node - The channel's message element.
 */

/**
 * @typedef {Object} Message
 * @property {HTMLElement} el
 * @property {Channel} channel
 * @property {ReturnType<typeof setTimeout> | undefined} timer
 * @property {number} at
 * @property {string} text
 * @property {AnnouncerPoliteness} politeness
 */

/**
 * @typedef {Object} Regions
 * @property {HTMLElement} root
 * @property {HTMLElement | undefined} polite
 * @property {HTMLElement | undefined} assertive
 * @property {number} politeReadyAt
 * @property {number} assertiveReadyAt
 * @property {Set<Message>} messages
 * @property {boolean} owned - Whether this module made the elements. An adopted `<Announcer />` keeps its own.
 */

/**
 * @typedef {Object} Announcer
 * @property {(message: string, options?: AnnounceOptions) => void} announce
 * @property {(channel?: string) => void} clear
 * @property {(options?: { assertive?: boolean }) => () => void} acquire
 * @property {(host: Element) => () => void} pushHost
 * @property {(regions: { polite: HTMLElement, assertive?: HTMLElement }) => () => void} adopt
 * @property {() => void} destroy
 */

/** @type {Announcer} */
const NOOP_ANNOUNCER = {
  announce() {},
  clear() {},
  acquire: () => () => {},
  pushHost: () => () => {},
  adopt: () => () => {},
  destroy() {},
};

/** @type {WeakMap<Document, Announcer>} */
const announcers = new WeakMap();

/**
 * The announcer for a document. On the server, or with no document, every
 * method does nothing.
 *
 * @param {Document | undefined} [doc]
 * @returns {Announcer}
 */
export function getAnnouncer(doc) {
  const target =
    doc ?? (typeof document === "undefined" ? undefined : document);
  if (!target) return NOOP_ANNOUNCER;
  let announcer = announcers.get(target);
  if (!announcer) {
    announcer = createAnnouncer(target);
    announcers.set(target, announcer);
  }
  return announcer;
}

/**
 * Say `message` to assistive technology.
 *
 * @param {string} message
 * @param {AnnounceOptions} [options]
 * @example
 * ```js
 * announce("12 results", { channel: "search", debounce: 500, dedupe: true });
 * announce("Could not save", { politeness: "assertive" });
 * ```
 */
export function announce(message, options) {
  getAnnouncer().announce(message, options);
}

/**
 * Drop the pending message and remove the spoken message of one channel, or of
 * every channel.
 *
 * @param {string} [channel]
 */
export function clearAnnouncements(channel) {
  getAnnouncer().clear(channel);
}

/**
 * Keep the live regions in the page, and create them now, so they exist well
 * before the first message. Call it when a component mounts, and call the
 * returned function when it unmounts. The regions are removed some time after
 * the last holder has left.
 *
 * @param {{ assertive?: boolean }} [options] - Create the assertive region too.
 * @returns {() => void}
 */
export function acquireAnnouncer(options) {
  return getAnnouncer().acquire(options);
}

/**
 * Make `host` the place messages go until the returned function is called.
 * Call it when a modal opens, with the dialog element: the rest of the page is
 * out of the accessibility tree, so the regions must be inside the dialog.
 * Hosts nest; the newest wins.
 *
 * @param {Element} host
 * @returns {() => void}
 */
export function pushAnnouncerHost(host) {
  return getAnnouncer().pushHost(host);
}

/**
 * A channel of messages for one component instance. Messages about the
 * component's element go into a dialog the element is in. Call `connect()`
 * in `onMount` and call the function it returns when the component leaves.
 *
 * @param {() => Element | null | undefined} [getSource] - The element the messages are about, read at each message.
 * @returns {{
 *   id: string,
 *   announce: (message: string, options?: AnnounceOptions) => void,
 *   clear: () => void,
 *   connect: () => () => void,
 * }}
 */
export function createAnnouncerChannel(getSource) {
  const id = uniqueId("ccs-announce");
  let connected = false;
  /** @type {[string, AnnounceOptions | undefined] | undefined} */
  let waiting;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let waitTimer;

  /**
   * @param {string} message
   * @param {AnnounceOptions} [options]
   */
  function send(message, options) {
    announce(message, { ...options, channel: id, source: getSource?.() });
  }

  function sendWaiting() {
    clearTimeout(waitTimer);
    waitTimer = undefined;
    const message = waiting;
    waiting = undefined;
    if (message) send(...message);
  }

  return {
    id,
    announce(message, options) {
      // A message from the component's own init, before it is mounted, waits
      // for `connect()` so the regions exist first. It does not wait past the
      // next task, in case `connect()` is never called.
      if (!connected && typeof document !== "undefined") {
        waiting = [message, options];
        waitTimer ??= setTimeout(sendWaiting, 0);
        return;
      }
      send(message, options);
    },
    clear() {
      waiting = undefined;
      clearAnnouncements(id);
    },
    connect() {
      connected = true;
      const release = acquireAnnouncer();
      sendWaiting();
      return () => {
        connected = false;
        waiting = undefined;
        clearTimeout(waitTimer);
        waitTimer = undefined;
        release();
        clearAnnouncements(id);
      };
    },
  };
}

/**
 * @param {Document} doc
 * @returns {Announcer}
 */
export function createAnnouncer(doc) {
  /** @type {Map<string, Channel>} */
  const channels = new Map();
  /** @type {WeakMap<Element, Regions>} */
  const hostRegions = new WeakMap();
  /** @type {Set<Element>} */
  const usedHosts = new Set();
  /** @type {Element[]} */
  const hostStack = [];
  /** @type {Regions[]} */
  const adopted = [];
  let holds = 0;
  let assertiveHolds = 0;

  const now = () => Date.now();

  /** @returns {Element | undefined} */
  function modalOf(/** @type {Element | null | undefined} */ source) {
    /** @type {Element | null | undefined} */
    let el = source?.closest('[aria-modal="true"], dialog');
    while (el) {
      if (isModalDialog(el)) return el;
      el = el.parentElement?.closest('[aria-modal="true"], dialog');
    }
    return undefined;
  }

  /**
   * The element the regions live in for a message about `source`.
   * @param {Element | null | undefined} source
   * @returns {Element | undefined} Undefined for the default place, the body.
   */
  function hostFor(source) {
    for (let i = hostStack.length - 1; i >= 0; i--) {
      const host = hostStack[i];
      if (host.isConnected) return host;
    }
    return modalOf(source);
  }

  /**
   * @param {Regions} regions
   * @param {AnnouncerPoliteness} politeness
   * @param {boolean} [forMessage] - Whether a message is the reason for making the region. Then the message waits for the reader to find the region first.
   * @returns {HTMLElement}
   */
  function regionOf(regions, politeness, forMessage = false) {
    const existing = regions[politeness];
    if (existing?.isConnected) return existing;
    const el = doc.createElement("div");
    el.setAttribute("role", politeness === "polite" ? "status" : "alert");
    el.setAttribute("aria-live", politeness);
    // Each message is its own element, so the reader says only the new one.
    el.setAttribute("aria-atomic", "false");
    el.setAttribute("aria-relevant", "additions");
    regions.root.append(el);
    regions[politeness] = el;
    const readyAt = forMessage ? now() + ANNOUNCER_READY_DELAY_MS : 0;
    if (politeness === "polite") regions.politeReadyAt = readyAt;
    else regions.assertiveReadyAt = readyAt;
    return el;
  }

  /**
   * @param {Element | undefined} host
   * @returns {Regions | undefined}
   */
  function regionsIn(host) {
    if (host === undefined) {
      const top = adopted[adopted.length - 1];
      if (top?.root.isConnected) return top;
    }
    const parent = host ?? doc.body;
    if (!parent) return undefined;
    let regions = hostRegions.get(parent);
    if (regions?.root.isConnected) return regions;
    const root = doc.createElement("div");
    root.className = "bx--visually-hidden";
    root.setAttribute("data-announcer", "");
    parent.append(root);
    regions = {
      root,
      polite: undefined,
      assertive: undefined,
      politeReadyAt: 0,
      assertiveReadyAt: 0,
      messages: new Set(),
      owned: true,
    };
    hostRegions.set(parent, regions);
    usedHosts.add(parent);
    return regions;
  }

  /** @param {Message} message */
  function removeMessage(message) {
    clearTimeout(message.timer);
    message.el.remove();
    if (message.channel.node === message) {
      message.channel.node = undefined;
      message.channel.lastMessage = undefined;
    }
    for (const host of usedHosts)
      hostRegions.get(host)?.messages.delete(message);
    for (const regions of adopted) regions.messages.delete(message);
    teardown();
  }

  /** @param {Channel} channel */
  function dropNode(channel) {
    if (channel.node) removeMessage(channel.node);
  }

  /**
   * Write one message. False when the region is not ready yet.
   * @param {Channel} channel
   * @param {string} text
   * @param {AnnounceOptions} options
   */
  function write(channel, text, options) {
    const politeness =
      options.politeness === "assertive" ? "assertive" : "polite";
    const regions = regionsIn(hostFor(options.source));
    if (!regions) return false;
    const region = regionOf(regions, politeness, true);
    const readyAt =
      politeness === "polite"
        ? regions.politeReadyAt
        : regions.assertiveReadyAt;
    const wait = readyAt - now();
    if (wait > 0) return wait;
    dropNode(channel);
    while (regions.messages.size >= MAX_MESSAGES) {
      const oldest = regions.messages.values().next().value;
      if (!oldest) break;
      removeMessage(oldest);
    }
    const el = doc.createElement("div");
    el.textContent = text;
    region.append(el);
    const clearAfter = options.clearAfter ?? ANNOUNCER_CLEAR_AFTER_MS;
    /** @type {Message} */
    const message = {
      el,
      channel,
      timer: undefined,
      at: now(),
      text,
      politeness,
    };
    message.timer = setTimeout(() => removeMessage(message), clearAfter);
    regions.messages.add(message);
    channel.node = message;
    channel.lastMessage = text;
    channel.lastAt = now();
    return true;
  }

  /** @param {Channel} channel */
  function flush(channel) {
    clearTimeout(channel.timer);
    channel.timer = undefined;
    const pending = channel.pending;
    if (!pending) return;
    if (!doc.body) {
      doc.addEventListener("DOMContentLoaded", () => flush(channel), {
        once: true,
      });
      return;
    }
    if (pending.options.dedupe && pending.message === channel.lastMessage) {
      channel.pending = undefined;
      return;
    }
    const result = write(channel, pending.message, pending.options);
    if (typeof result === "number") {
      channel.timer = setTimeout(() => flush(channel), result);
      return;
    }
    if (result) channel.pending = undefined;
  }

  /** @param {string} id */
  function channelOf(id) {
    let channel = channels.get(id);
    if (!channel) {
      channel = {
        id,
        pending: undefined,
        timer: undefined,
        lastAt: 0,
        lastMessage: undefined,
        node: undefined,
      };
      channels.set(id, channel);
    }
    return channel;
  }

  /**
   * @param {string} message
   * @param {AnnounceOptions} [options]
   */
  function announce(message, options = {}) {
    const id = options.channel ?? "default";
    const channel = channelOf(id);
    if (message === "" || message == null) {
      clearChannel(channel);
      return;
    }
    const text = String(message);
    if (options.dedupe) {
      const current = channel.pending
        ? channel.pending.message
        : channel.lastMessage;
      if (current === text) return;
    }
    // A pending message of another politeness is replaced, not spoken late.
    channel.pending = { message: text, options };
    const debounce = Math.max(0, options.debounce ?? 0);
    const throttle = Math.max(0, options.throttle ?? 0);
    const gap =
      throttle > 0 && channel.lastAt > 0
        ? channel.lastAt + throttle - now()
        : 0;
    const wait = Math.max(debounce, gap, 0);
    if (wait === 0) {
      flush(channel);
      return;
    }
    // A debounce starts over with each message. A throttle keeps the timer
    // of the first, so a steady stream is still heard once per gap.
    if (debounce > 0 || channel.timer === undefined) {
      clearTimeout(channel.timer);
      channel.timer = setTimeout(() => flush(channel), wait);
    }
  }

  /** @param {Channel} channel */
  function clearChannel(channel) {
    clearTimeout(channel.timer);
    channel.timer = undefined;
    channel.pending = undefined;
    dropNode(channel);
  }

  /** @param {string} [id] */
  function clear(id) {
    if (id !== undefined) {
      const channel = channels.get(id);
      if (channel) clearChannel(channel);
      return;
    }
    for (const channel of channels.values()) clearChannel(channel);
  }

  /** Whether a holder (a mounted component, an open modal) needs the regions. */
  function held() {
    return holds > 0 || hostStack.length > 0;
  }

  /** Whether a message is waiting or still in a region. */
  function inFlight() {
    for (const channel of channels.values()) if (channel.pending) return true;
    for (const host of usedHosts) {
      if ((hostRegions.get(host)?.messages.size ?? 0) > 0) return true;
    }
    return false;
  }

  /**
   * Remove the regions this module made when nobody holds them and no message
   * is waiting or left in them. Runs when a holder leaves and when a message
   * does, so a test or an app is left with no stray live region.
   */
  function teardown() {
    if (held() || inFlight()) return;
    for (const host of usedHosts) {
      const regions = hostRegions.get(host);
      if (regions?.owned) regions.root.remove();
      hostRegions.delete(host);
    }
    usedHosts.clear();
    for (const [id, channel] of channels) {
      if (!channel.pending && !channel.node) channels.delete(id);
    }
  }

  /** @param {{ assertive?: boolean }} [options] */
  function acquire(options = {}) {
    holds++;
    if (options.assertive) assertiveHolds++;
    const regions = regionsIn(hostFor(undefined));
    if (regions) {
      regionOf(regions, "polite");
      if (assertiveHolds > 0) regionOf(regions, "assertive");
    }
    let released = false;
    return () => {
      if (released) return;
      released = true;
      holds--;
      if (options.assertive) assertiveHolds--;
      if (holds === 0) teardown();
    };
  }

  /** @param {Element} host */
  function pushHost(host) {
    hostStack.push(host);
    const regions = regionsIn(host);
    if (regions) regionOf(regions, "polite");
    let popped = false;
    return () => {
      if (popped) return;
      popped = true;
      const index = hostStack.lastIndexOf(host);
      if (index !== -1) hostStack.splice(index, 1);
      const leaving = hostRegions.get(host);
      if (!leaving) return;
      // A message written a moment ago did not get heard in a dialog that is
      // closing. Say it again from wherever messages go now.
      const recent = [...leaving.messages].filter((m) => now() - m.at < 1000);
      for (const message of recent) {
        const channel = message.channel;
        channel.pending = {
          message: message.text,
          options: { politeness: message.politeness, channel: channel.id },
        };
        removeMessage(message);
        flush(channel);
      }
      if (leaving.owned) leaving.root.remove();
      hostRegions.delete(host);
      usedHosts.delete(host);
      teardown();
    };
  }

  /** @param {{ polite: HTMLElement, assertive?: HTMLElement }} elements */
  function adopt(elements) {
    /** @type {Regions} */
    const regions = {
      root: /** @type {HTMLElement} */ (
        elements.polite.parentElement ?? elements.polite
      ),
      polite: elements.polite,
      assertive: elements.assertive,
      politeReadyAt: 0,
      assertiveReadyAt: 0,
      messages: new Set(),
      owned: false,
    };
    adopted.push(regions);
    return () => {
      const index = adopted.indexOf(regions);
      if (index !== -1) adopted.splice(index, 1);
      for (const message of [...regions.messages]) removeMessage(message);
    };
  }

  function destroy() {
    clear();
    for (const host of usedHosts) {
      const regions = hostRegions.get(host);
      if (regions?.owned) regions.root.remove();
      hostRegions.delete(host);
    }
    usedHosts.clear();
    channels.clear();
    hostStack.length = 0;
    holds = 0;
    assertiveHolds = 0;
  }

  return { announce, clear, acquire, pushHost, adopt, destroy };
}

/**
 * @typedef {Object} SourceStatusEdge
 * @property {"idle" | "loading" | "success" | "error"} type
 * @property {number} [count] - `data.length` for an array.
 * @property {string} [reason] - `"fetch"`, `"cache"`, `"more"`, `"length"`, `"cancel"` or `"reset"`.
 */

/**
 * @typedef {Object} SourceStatusOptions
 * @property {string} [channel="source"]
 * @property {(edge: SourceStatusEdge) => string} [loading] - The text for the loading edge. Leave it out to say nothing.
 * @property {(count: number, edge: SourceStatusEdge) => string} results - The text for an answer with `count` items.
 * @property {(added: number, count: number, edge: SourceStatusEdge) => string} [more] - The text for an appended page.
 * @property {(edge: SourceStatusEdge) => string} [error] - The text for a failure, said assertively.
 * @property {number} [loadingDelay=500] - Wait this long before "loading", so an answer that comes first replaces it.
 * @property {number} [resultsDelay=500] - Wait this long after the last answer before the count.
 * @property {Element | null} [source]
 */

/**
 * Speak the edges of an async source (the `onStatus` hook of
 * `createAsyncSource`) through the announcer, and return the function that
 * stops it.
 *
 * "Loading" is said only if the answer is slow, "N results" once the answers
 * settle and only when the count changed, "N more" for an appended page, and
 * the failure assertively. A cancel or a reset says nothing and drops what was
 * waiting. The texts come from the caller, so they go through
 * `translateWithId`.
 *
 * @param {(listener: (edge: SourceStatusEdge) => void) => (void | (() => void))} onStatus
 * @param {SourceStatusOptions} options
 * @returns {() => void}
 */
export function announceSourceStatus(onStatus, options) {
  const channel = options.channel ?? "source";
  const source = options.source;
  let spoken = 0;
  const stop = onStatus((edge) => {
    const count = edge.count ?? 0;
    switch (edge.type) {
      case "loading":
        // A cached answer is at once; there is nothing to wait for.
        if (edge.reason === "cache" || !options.loading) return;
        announce(options.loading(edge), {
          channel,
          debounce: options.loadingDelay ?? 500,
          source,
        });
        return;
      case "success": {
        const added = count - spoken;
        const text =
          edge.reason === "more" && options.more && added > 0
            ? options.more(added, count, edge)
            : options.results(count, edge);
        spoken = count;
        announce(text, {
          channel,
          debounce: options.resultsDelay ?? 500,
          dedupe: edge.reason !== "more",
          source,
        });
        return;
      }
      case "error":
        if (options.error) {
          announce(options.error(edge), {
            channel,
            politeness: "assertive",
            source,
          });
        }
        return;
      default:
        spoken = 0;
        clearAnnouncements(channel);
    }
  });
  return () => {
    if (typeof stop === "function") stop();
    clearAnnouncements(channel);
  };
}
