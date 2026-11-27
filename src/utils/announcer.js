// @ts-check
import {
  ANNOUNCER_CLEAR_AFTER_MS,
  ANNOUNCER_READY_DELAY_MS,
} from "../constants/timing.js";
import { isModalDialog } from "./modal-dialog.js";

/**
 * One polite live region per document, shared by every component that has
 * something to say.
 *
 * - A message is a new element in the region, not new text in a fixed
 *   element. The same words twice in a row are two additions, so a screen
 *   reader says both, and no empty-then-set tick is needed.
 * - Each message belongs to a channel. A newer message on a channel replaces
 *   the channel's earlier one, so "12 results" then "9 results" says 9.
 * - The region is made on first use and leaves when nothing holds it and its
 *   last message is gone. A message about an element in an open modal dialog
 *   goes to a region inside the dialog, since the rest of the page is out of
 *   the accessibility tree there.
 * - Nothing here touches `document` at import. On the server every call does
 *   nothing.
 */

/** Most messages one region holds. The oldest is removed past this. */
const MAX_MESSAGES = 12;

/**
 * @typedef {Object} AnnounceOptions
 * @property {string} [channel="default"] - A source of messages. A newer message on a channel replaces its earlier one.
 * @property {number} [debounce=0] - Wait this long (ms) after the last message on the channel, then say the latest.
 * @property {Element | null} [source] - The element the message is about. In an open modal dialog, the message goes into the dialog.
 */

/**
 * @typedef {Object} Region
 * @property {HTMLElement} el - The `role="status"` element.
 * @property {HTMLElement | undefined} root - The wrapper this module made, and removes. Undefined for an `<Announcer />`.
 * @property {number} readyAt - When the region may take a message.
 */

/**
 * @typedef {Object} Channel
 * @property {string} id
 * @property {{ text: string, source: Element | null | undefined } | undefined} pending
 * @property {ReturnType<typeof setTimeout> | undefined} timer
 * @property {Message | undefined} message - The channel's message in a region.
 */

/**
 * @typedef {Object} Message
 * @property {HTMLElement} el
 * @property {Channel} channel
 * @property {ReturnType<typeof setTimeout> | undefined} timer
 */

/**
 * @typedef {Object} Announcer
 * @property {(message: string, options?: AnnounceOptions) => void} announce
 * @property {(channel: string) => void} clear
 * @property {(source?: Element | null) => () => void} acquire
 * @property {(region: HTMLElement) => () => void} adopt
 * @property {() => void} destroy
 */

/** @type {Announcer} */
const NOOP_ANNOUNCER = {
  announce() {},
  clear() {},
  acquire: () => () => {},
  adopt: () => () => {},
  destroy() {},
};

/** @type {WeakMap<Document, Announcer>} */
const announcers = new WeakMap();

/**
 * The announcer for a document. On the server every method does nothing.
 *
 * @param {Document} [doc]
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
 * Say `message` to screen readers, politely. An empty message clears the
 * channel: its waiting message is dropped and its spoken one removed.
 *
 * @param {string} message
 * @param {AnnounceOptions} [options]
 * @example
 * ```js
 * announce("Saved");
 * announce("12 results", { channel: "results", debounce: 500 });
 * ```
 */
export function announce(message, options) {
  getAnnouncer().announce(message, options);
}

let channelCount = 0;

/**
 * A channel of messages for one component instance. Call `connect()` in
 * `onMount`, which makes the region before the first message, and call the
 * function it returns when the component leaves. A message sent before
 * `connect()`, from the component's init, waits for it, up to the next task.
 *
 * @param {() => Element | null | undefined} [getSource] - The element the messages are about, read at each message.
 * @returns {{
 *   announce: (message: string, options?: { debounce?: number }) => void,
 *   clear: () => void,
 *   connect: () => () => void,
 * }}
 */
export function createAnnouncerChannel(getSource) {
  const channel = `ccs-announce-${++channelCount}`;
  let connected = false;
  /** @type {[string, { debounce?: number } | undefined] | undefined} */
  let waiting;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let waitTimer;

  /**
   * @param {string} message
   * @param {{ debounce?: number }} [options]
   */
  function send(message, options) {
    getAnnouncer().announce(message, {
      debounce: options?.debounce,
      channel,
      source: getSource?.(),
    });
  }

  function sendWaiting() {
    clearTimeout(waitTimer);
    waitTimer = undefined;
    const message = waiting;
    waiting = undefined;
    if (message) send(...message);
  }

  return {
    announce(message, options) {
      // Before mount the source element is not bound yet, so the message
      // could not find a dialog the component is in.
      if (!connected && typeof document !== "undefined") {
        waiting = [message, options];
        waitTimer ??= setTimeout(sendWaiting, 0);
        return;
      }
      send(message, options);
    },
    clear() {
      waiting = undefined;
      getAnnouncer().clear(channel);
    },
    connect() {
      connected = true;
      const release = getAnnouncer().acquire(getSource?.());
      sendWaiting();
      return () => {
        connected = false;
        waiting = undefined;
        clearTimeout(waitTimer);
        waitTimer = undefined;
        getAnnouncer().clear(channel);
        release();
      };
    },
  };
}

/** @param {HTMLElement} el */
function setRegionAttributes(el) {
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");
  // Each message is its own element, so a reader says only the new one.
  el.setAttribute("aria-atomic", "false");
  el.setAttribute("aria-relevant", "additions");
}

/**
 * @param {Document} doc
 * @returns {Announcer}
 */
export function createAnnouncer(doc) {
  /** @type {Map<string, Channel>} */
  const channels = new Map();
  /** @type {Map<Element, Region>} Regions this module made, by the element they are in. */
  const made = new Map();
  /** @type {Region[]} Regions of mounted `<Announcer />`s, newest last. */
  const adopted = [];
  /** @type {Set<Message>} */
  const messages = new Set();
  let holds = 0;

  /**
   * The open modal dialog `source` is in, if any.
   * @param {Element | null | undefined} source
   * @returns {Element | undefined}
   */
  function modalOf(source) {
    let el = source?.closest('[aria-modal="true"], dialog');
    while (el) {
      if (isModalDialog(el)) return el;
      el = el.parentElement?.closest('[aria-modal="true"], dialog');
    }
    return undefined;
  }

  /**
   * The region for a message about `source`, made if needed.
   * @param {Element | null | undefined} source
   * @param {boolean} forMessage - Whether a message is the reason to make the region. Then the message waits for a screen reader to find the region first. A region made for a holder, or an `<Announcer />`, takes messages at once: it was in the page before anyone had something to say.
   * @returns {Region | undefined}
   */
  function regionFor(source, forMessage) {
    const modal = modalOf(source);
    if (!modal) {
      for (let i = adopted.length - 1; i >= 0; i--) {
        if (adopted[i].el.isConnected) return adopted[i];
      }
    }
    const parent = modal ?? doc.body;
    if (!parent) return undefined;
    const existing = made.get(parent);
    if (existing?.el.isConnected) return existing;
    // Forget regions that left with their dialog.
    for (const [host, region] of made) {
      if (!region.el.isConnected) made.delete(host);
    }
    const root = doc.createElement("div");
    root.className = "bx--visually-hidden";
    root.setAttribute("data-announcer", "");
    const el = doc.createElement("div");
    setRegionAttributes(el);
    root.append(el);
    parent.append(root);
    /** @type {Region} */
    const region = {
      el,
      root,
      readyAt: forMessage ? Date.now() + ANNOUNCER_READY_DELAY_MS : 0,
    };
    made.set(parent, region);
    return region;
  }

  /** @param {Channel} channel */
  function prune(channel) {
    if (!channel.pending && !channel.message && channel.timer === undefined) {
      channels.delete(channel.id);
    }
  }

  /** @param {Message} message */
  function detach(message) {
    clearTimeout(message.timer);
    message.el.remove();
    messages.delete(message);
  }

  /** @param {Message} message */
  function drop(message) {
    detach(message);
    if (message.channel.message === message) {
      message.channel.message = undefined;
      prune(message.channel);
    }
  }

  /**
   * Remove the regions this module made once nothing holds them and no
   * message waits or is left in them, so a page or a test keeps no stray
   * live region.
   */
  function teardown() {
    if (holds > 0 || messages.size > 0) return;
    for (const channel of channels.values()) if (channel.pending) return;
    for (const region of made.values()) region.root?.remove();
    made.clear();
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
    const region = regionFor(pending.source, true);
    if (!region) return;
    const wait = region.readyAt - Date.now();
    if (wait > 0) {
      channel.timer = setTimeout(() => flush(channel), wait);
      return;
    }
    channel.pending = undefined;
    // Not `drop`, which would forget the channel it is about to write to.
    if (channel.message) detach(channel.message);
    for (const message of messages) {
      if (region.el.childElementCount < MAX_MESSAGES) break;
      if (message.el.parentElement === region.el) drop(message);
    }
    const el = doc.createElement("div");
    el.textContent = pending.text;
    region.el.append(el);
    /** @type {Message} */
    const message = { el, channel, timer: undefined };
    message.timer = setTimeout(() => {
      drop(message);
      teardown();
    }, ANNOUNCER_CLEAR_AFTER_MS);
    messages.add(message);
    channel.message = message;
  }

  /** @param {string} id */
  function channelOf(id) {
    let channel = channels.get(id);
    if (!channel) {
      channel = {
        id,
        pending: undefined,
        timer: undefined,
        message: undefined,
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
    if (!message) {
      clear(id);
      return;
    }
    const channel = channelOf(id);
    channel.pending = { text: String(message), source: options.source };
    const debounce = Math.max(0, options.debounce ?? 0);
    if (debounce === 0) {
      flush(channel);
      return;
    }
    clearTimeout(channel.timer);
    channel.timer = setTimeout(() => flush(channel), debounce);
  }

  /** @param {string} id */
  function clear(id) {
    const channel = channels.get(id);
    if (!channel) return;
    clearTimeout(channel.timer);
    channel.timer = undefined;
    channel.pending = undefined;
    if (channel.message) drop(channel.message);
    prune(channel);
    teardown();
  }

  /** @param {Element | null} [source] */
  function acquire(source) {
    holds++;
    regionFor(source, false);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      holds--;
      teardown();
    };
  }

  /** @param {HTMLElement} el */
  function adopt(el) {
    /** @type {Region} */
    const region = { el, root: undefined, readyAt: 0 };
    adopted.push(region);
    return () => {
      const index = adopted.indexOf(region);
      if (index !== -1) adopted.splice(index, 1);
      for (const message of [...messages]) {
        if (message.el.parentElement === el) drop(message);
      }
      teardown();
    };
  }

  function destroy() {
    for (const channel of channels.values()) clearTimeout(channel.timer);
    for (const message of [...messages]) drop(message);
    for (const region of made.values()) region.root?.remove();
    channels.clear();
    made.clear();
    adopted.length = 0;
    holds = 0;
  }

  return { announce, clear, acquire, adopt, destroy };
}
