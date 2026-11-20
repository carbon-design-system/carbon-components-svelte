// @ts-check
import { safeBrowserStorage } from "./storage.js";

/**
 * @typedef {"active" | "warning" | "expired"} IdleStatus
 * @typedef {"timeout" | "signout"} IdleExpireReason
 */

/** The events that count as activity unless `events` says otherwise. */
export const IDLE_EVENTS = Object.freeze([
  "pointerdown",
  "keydown",
  "scroll",
  "visibilitychange",
]);

/** The longest delay a timer takes (2^31 - 1 ms, about 24.8 days). */
const MAX_DELAY = 2147483647;

/**
 * The pure core of the idle timer: one deadline, a warning window before it,
 * and a terminal expired state. It owns no timers and reads no clock; every
 * method takes the time to judge at, so a test or a resumed laptop passes
 * the time it has and gets the answer the wall clock would give.
 *
 * Activity is judged at its own timestamp, not at the time it is handled.
 * An event from before the warning started still counts when it arrives late
 * (another tab's message), and one from inside the warning never does.
 *
 * @param {object} options
 * @param {number} [options.timeout] - Idle time in ms before the deadline.
 *   `Infinity` when only a server deadline moves it.
 * @param {number} [options.warnBefore] - How long before the deadline the
 *   warning starts, in ms.
 * @param {number} options.startAt - When the session began, in ms.
 * @param {number} [options.deadline] - A server-set deadline, in ms. The
 *   deadline then moves only by `extend` and `setDeadline`.
 */
export function createIdleMachine({
  timeout = Number.POSITIVE_INFINITY,
  warnBefore = 0,
  startAt,
  deadline,
}) {
  let serverDriven = deadline != null;
  let end = deadline ?? startAt + timeout;
  let last = startAt;
  /** @type {null | IdleExpireReason} */
  let expired = null;

  return {
    /**
     * @param {number} at
     * @returns {IdleStatus}
     */
    status(at) {
      if (expired !== null || at >= end) return "expired";
      return at >= end - warnBefore ? "warning" : "active";
    },
    /** @param {number} at */
    remaining(at) {
      return expired === null ? Math.max(0, end - at) : 0;
    },
    /**
     * Count activity at `at`. It moves the deadline only while the session is
     * active at `at`, and only when the deadline slides (no server deadline).
     * @param {number} at
     * @returns {boolean} Whether the deadline moved.
     */
    activity(at) {
      if (expired !== null || serverDriven || at <= last) return false;
      if (at >= end - warnBefore) return false;
      last = at;
      end = at + timeout;
      return true;
    },
    /**
     * The user chose to stay. Moves the deadline to `nextDeadline`, or `timeout`
     * after `at`. Refused once the deadline has passed.
     * @param {number} at
     * @param {number} [nextDeadline]
     * @returns {boolean}
     */
    extend(at, nextDeadline) {
      if (expired !== null || at >= end) return false;
      const next = nextDeadline ?? at + timeout;
      if (!Number.isFinite(next)) return false;
      if (nextDeadline == null) serverDriven = false;
      last = Math.max(last, at);
      end = next;
      return true;
    },
    /**
     * Set the deadline from the server. Activity stops sliding it.
     * @param {number} nextDeadline
     * @returns {boolean}
     */
    setDeadline(nextDeadline) {
      if (expired !== null || !Number.isFinite(nextDeadline)) return false;
      serverDriven = true;
      end = nextDeadline;
      return true;
    },
    /**
     * @param {IdleExpireReason} reason
     * @returns {boolean} False when it had already expired.
     */
    expire(reason) {
      if (expired !== null) return false;
      expired = reason;
      return true;
    },
    /**
     * Start a new session, such as after signing in again.
     * @param {number} at
     * @param {number} [nextDeadline]
     */
    reset(at, nextDeadline) {
      expired = null;
      serverDriven = nextDeadline != null;
      last = at;
      end = nextDeadline ?? at + timeout;
    },
    snapshot() {
      return { deadline: end, expired, serverDriven, lastActivity: last };
    },
    /**
     * The next time the status changes by itself, or `null` once expired.
     * @param {number} at
     */
    nextBoundary(at) {
      const status = this.status(at);
      if (status === "expired") return null;
      return status === "warning" ? end : end - warnBefore;
    },
  };
}

/**
 * @typedef {Date | number} IdleDeadline
 * @typedef {IdleDeadline | { expiresAt: IdleDeadline; serverNow?: IdleDeadline }} IdleExtendResult
 */

/**
 * @typedef {object} IdleState
 * @property {IdleStatus} status
 * @property {null | Date} expiresAt - When the session ends on this
 *   device's clock. Only set while the status is not `"active"`.
 * @property {null | IdleExpireReason} reason - Why it expired.
 * @property {boolean} remote - Whether another tab expired it.
 * @property {boolean} extending - Whether `onExtend` is running for a
 *   request from the user.
 * @property {unknown} error - What the last `onExtend` for the user threw.
 */

/**
 * @typedef {object} IdleTimerOptions
 * @property {number} [timeout] - Idle time in ms before the user is signed out.
 *   Required unless `expiresAt` is set.
 * @property {number} [warnBefore] - Warn this long before the end, in ms.
 *   Default 120000. WCAG 2.2.1 wants at least 20 seconds.
 * @property {IdleDeadline} [expiresAt] - End the session at this time instead,
 *   such as a token's `exp`. Activity then does not move it.
 * @property {IdleDeadline} [serverNow] - The server's current time for
 *   `expiresAt`, to correct a clock that is off.
 * @property {ReadonlyArray<string>} [events] - Events that count as activity.
 * @property {number} [throttle] - Ignore activity within this many ms of the
 *   last one counted. Default 1000.
 * @property {boolean} [crossTab] - Share activity, extension and sign-out
 *   with the other tabs of this origin.
 * @property {string} [channelName] - Names the channel and storage key
 *   that `crossTab` uses. Default `"carbon-idle-timer"`.
 * @property {number | false} [heartbeat] - With `onExtend`, call it for
 *   activity at most this often, in ms. `false` to call it only when the
 *   user chooses to stay.
 * @property {(info: { reason: "user" | "activity" }) => void | IdleExtendResult | Promise<void | IdleExtendResult>} [onExtend]
 *   - Tell the server the user is here. Return the new end of the session if
 *   the server sets it; return nothing for `timeout` from now. A throw
 *   keeps the warning up.
 * @property {() => void} [onWarn] - The warning started.
 * @property {(info: { reason: IdleExpireReason; remote: boolean }) => void} [onExpire]
 *   - The session ended. It runs in every tab; call the server once, for
 *   `remote: false`.
 * @property {(error: unknown) => void} [onError] - `onExtend` threw.
 * @property {() => number} [now] - The clock, in ms. Default `Date.now`.
 */

let counter = 0;

/** @param {IdleExtendResult | void} result */
function readExtendResult(result) {
  if (result == null) return null;
  if (typeof result === "object" && !(result instanceof Date)) {
    return { expiresAt: +result.expiresAt, serverNow: result.serverNow };
  }
  return { expiresAt: +result, serverNow: undefined };
}

/**
 * Watch for a user who has gone idle, warn before the session ends, and end
 * it. A Svelte store of {@link IdleState} with methods.
 *
 * Nothing runs until `start()`, and `start()` does nothing on the server, so
 * creating the timer in a component's init is safe to server render. Time is
 * judged by the wall clock at every check, so a hidden tab whose timers are
 * throttled, or a laptop that slept, is right as soon as it wakes.
 *
 * @param {IdleTimerOptions} options
 */
export function createIdleTimer(options) {
  const {
    timeout,
    warnBefore = 120000,
    events = IDLE_EVENTS,
    throttle = 1000,
    crossTab = false,
    channelName = "carbon-idle-timer",
    onExtend,
    onWarn,
    onExpire,
    onError,
  } = options ?? {};
  const now = options?.now ?? (() => Date.now());

  if (timeout == null && options?.expiresAt == null) {
    throw new TypeError("createIdleTimer needs a timeout or an expiresAt");
  }
  const slide = timeout ?? Number.POSITIVE_INFINITY;
  const beatEvery =
    options?.heartbeat === false
      ? 0
      : (options?.heartbeat ??
        (Number.isFinite(slide)
          ? Math.max(1000, Math.floor((slide - warnBefore) / 2))
          : 60000));

  /** @param {IdleDeadline} expiresAt @param {IdleDeadline} [serverNow] */
  function toLocalDeadline(expiresAt, serverNow) {
    const skew = serverNow == null ? 0 : +serverNow - now();
    return +expiresAt - skew;
  }

  const tabId = `${Math.random().toString(36).slice(2)}${++counter}`;
  const storage = safeBrowserStorage("localStorage");
  /** @type {Set<(state: IdleState) => void>} */
  const subscribers = new Set();
  /** @type {null | ReturnType<typeof createIdleMachine>} */
  let machine = null;
  /** @type {IdleState} */
  let state = {
    status: "active",
    expiresAt: null,
    reason: null,
    remote: false,
    extending: false,
    error: null,
  };
  let started = false;
  let startedAt = 0;
  let lastEvent = Number.NEGATIVE_INFINITY;
  let lastBeat = 0;
  let remote = false;
  let extending = false;
  /** @type {unknown} */
  let error = null;
  /** @type {null | ReturnType<typeof setTimeout>} */
  let timer = null;
  /** @type {null | Promise<boolean>} */
  let inFlight = null;
  /** @type {null | BroadcastChannel} */
  let channel = null;
  /** @type {Array<() => void>} */
  let teardown = [];
  let warned = false;

  function build() {
    const m = machine;
    if (!m) return state;
    const at = now();
    const status = m.status(at);
    const { expired, deadline } = m.snapshot();
    return {
      status,
      expiresAt: status === "active" ? null : new Date(deadline),
      reason: expired,
      remote,
      extending,
      error,
    };
  }

  function publish() {
    const next = build();
    if (
      next.status === state.status &&
      +(next.expiresAt ?? 0) === +(state.expiresAt ?? 0) &&
      next.reason === state.reason &&
      next.remote === state.remote &&
      next.extending === state.extending &&
      next.error === state.error
    ) {
      return;
    }
    state = next;
    for (const run of [...subscribers]) run(state);
  }

  /** @param {object} message */
  function send(message) {
    if (!crossTab) return;
    const record = { ...message, id: tabId, n: ++counter };
    try {
      channel?.postMessage(record);
    } catch {}
    // Always stored: a tab that was frozen reads it on waking, and without
    // a BroadcastChannel the write itself is what other tabs hear.
    storage.setItem(channelName, JSON.stringify(record));
  }

  function clearTimer() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }

  function schedule() {
    clearTimer();
    if (!machine) return;
    const at = now();
    const boundary = machine.nextBoundary(at);
    if (boundary === null) return;
    timer = setTimeout(
      () => {
        timer = null;
        evaluate();
      },
      Math.min(MAX_DELAY, Math.max(1, boundary - at)),
    );
  }

  /**
   * @param {IdleExpireReason} reason
   * @param {boolean} fromRemote
   */
  function end(reason, fromRemote) {
    if (!machine?.expire(reason)) return false;
    remote = fromRemote;
    clearTimer();
    publish();
    onExpire?.({ reason, remote: fromRemote });
    return true;
  }

  /** Bring the state up to date with the clock. */
  function evaluate() {
    if (!machine) return;
    let at = now();
    if (machine.status(at) === "expired" && !machine.snapshot().expired) {
      // Another tab may have extended while this one's timers were frozen.
      readStored();
      at = now();
    }
    if (machine.status(at) === "expired" && !machine.snapshot().expired) {
      if (end("timeout", false))
        send({ type: "expire", reason: "timeout", at });
      return;
    }
    const status = machine.status(at);
    if (status === "warning" && !warned) {
      warned = true;
      publish();
      onWarn?.();
    } else {
      if (status === "active") warned = false;
      publish();
    }
    schedule();
  }

  /**
   * @param {any} message
   */
  function receive(message) {
    if (!machine || !message || typeof message !== "object") return;
    if (message.id === tabId || typeof message.at !== "number") return;
    switch (message.type) {
      case "activity":
        if (machine.activity(message.at)) evaluate();
        break;
      case "extend":
      case "deadline": {
        const { deadline } = machine.snapshot();
        if (typeof message.deadline !== "number") break;
        // An extension that is not later than this tab's own is stale.
        if (message.type === "extend" && message.deadline <= deadline) break;
        if (
          message.type === "extend"
            ? machine.extend(message.at, message.deadline)
            : machine.setDeadline(message.deadline)
        ) {
          evaluate();
        }
        break;
      }
      case "expire": {
        const reason = message.reason === "signout" ? "signout" : "timeout";
        // A timeout reached by a stale deadline, such as a frozen tab's, does
        // not end a session another tab extended since.
        if (reason === "timeout" && message.at < machine.snapshot().deadline) {
          break;
        }
        // A sign-out from before this timer started belongs to a past session.
        if (message.at < startedAt) break;
        end(reason, true);
        break;
      }
      case "reset":
        // A reset already applied, or from before this timer started.
        if (message.at <= startedAt) break;
        startedAt = message.at;
        machine.reset(
          message.at,
          typeof message.deadline === "number" ? message.deadline : undefined,
        );
        remote = false;
        warned = false;
        evaluate();
        break;
    }
  }

  let reading = false;
  function readStored() {
    // Applying a record re-evaluates, which can read again.
    if (!crossTab || reading) return;
    reading = true;
    try {
      const raw = storage.getItem(channelName);
      if (raw) receive(JSON.parse(raw));
    } catch {
    } finally {
      reading = false;
    }
  }

  /** @param {Event} event */
  function onActivityEvent(event) {
    if (!machine) return;
    if (event.type === "visibilitychange" && document.hidden) return;
    const at = now();
    if (at - lastEvent < throttle) return;
    lastEvent = at;
    // Judge the event against the clock, not against a timer that may be late.
    evaluate();
    if (machine.status(at) !== "active") return;
    if (machine.activity(at)) {
      schedule();
      send({ type: "activity", at });
    }
    heartbeatFor(at);
  }

  /** @param {number} at */
  function heartbeatFor(at) {
    if (!onExtend || !beatEvery || at - lastBeat < beatEvery) return;
    lastBeat = at;
    extend("activity");
  }

  /** Re-read the clock when the page is shown again. */
  function resume() {
    if (document.hidden) return;
    readStored();
    evaluate();
  }

  /**
   * Keep the session going. With `onExtend`, the server is asked first.
   * @param {"user" | "activity"} [reason]
   * @returns {Promise<boolean>} Whether the session was extended.
   */
  function extend(reason = "user") {
    if (!machine) return Promise.resolve(false);
    evaluate();
    if (machine.status(now()) === "expired") return Promise.resolve(false);
    if (inFlight) return inFlight;
    const user = reason === "user";
    if (user) {
      extending = true;
      error = null;
      publish();
    }
    const run = (async () => {
      try {
        const result = readExtendResult(await onExtend?.({ reason }));
        const at = now();
        if (!machine) return false;
        const deadline = result
          ? toLocalDeadline(result.expiresAt, result.serverNow)
          : undefined;
        if (machine.status(at) === "expired") return false;
        if (!machine.extend(at, deadline)) {
          throw new Error(
            "onExtend returned no end time, and there is no timeout to add",
          );
        }
        if (user) lastBeat = at;
        send({
          type: "extend",
          at,
          deadline: machine.snapshot().deadline,
        });
        return true;
      } catch (thrown) {
        if (user) error = thrown;
        onError?.(thrown);
        return false;
      } finally {
        extending = false;
        inFlight = null;
        evaluate();
      }
    })();
    inFlight = run;
    return run;
  }

  /**
   * @param {Document} doc
   * @param {Window} win
   */
  function listen(doc, win) {
    for (const type of events) {
      const target = type === "visibilitychange" ? doc : win;
      target.addEventListener(type, onActivityEvent, {
        capture: true,
        passive: true,
      });
      teardown.push(() =>
        target.removeEventListener(type, onActivityEvent, { capture: true }),
      );
    }
    doc.addEventListener("visibilitychange", resume);
    win.addEventListener("pageshow", resume);
    win.addEventListener("focus", resume);
    teardown.push(() => {
      doc.removeEventListener("visibilitychange", resume);
      win.removeEventListener("pageshow", resume);
      win.removeEventListener("focus", resume);
    });
  }

  /** @param {Window} win */
  function openChannel(win) {
    if (typeof BroadcastChannel === "function") {
      channel = new BroadcastChannel(channelName);
      channel.onmessage = (event) => receive(event.data);
      teardown.push(() => {
        channel?.close();
        channel = null;
      });
    } else {
      /** @param {StorageEvent} event */
      const onStorage = (event) => {
        if (event.key !== channelName || !event.newValue) return;
        try {
          receive(JSON.parse(event.newValue));
        } catch {}
      };
      win.addEventListener("storage", onStorage);
      teardown.push(() => win.removeEventListener("storage", onStorage));
    }
  }

  const api = {
    /** @param {(state: IdleState) => void} run */
    subscribe(run) {
      subscribers.add(run);
      run(state);
      return () => {
        subscribers.delete(run);
      };
    },
    /**
     * Start watching. Does nothing on the server, and when already started.
     * @returns {() => void} Stop watching.
     */
    start() {
      if (started || typeof window === "undefined") return api.stop;
      started = true;
      startedAt = lastBeat = now();
      remote = false;
      extending = false;
      error = null;
      warned = false;
      const expiresAt = options?.expiresAt;
      const deadline =
        expiresAt == null
          ? undefined
          : toLocalDeadline(expiresAt, options?.serverNow);
      machine = createIdleMachine({
        timeout: slide,
        warnBefore,
        startAt: startedAt,
        deadline,
      });
      listen(document, window);
      if (crossTab) {
        openChannel(window);
        // Opening a page is activity: tabs already open get the time.
        if (deadline === undefined) send({ type: "activity", at: startedAt });
      }
      evaluate();
      return api.stop;
    },
    /** Stop watching and release the listeners, timer and channel. */
    stop() {
      if (!started) return;
      started = false;
      clearTimer();
      for (const undo of teardown) undo();
      teardown = [];
      machine = null;
      inFlight = null;
    },
    /**
     * Count activity now, such as for input the listeners cannot see.
     * Ignored once the warning has started.
     */
    activity() {
      if (!machine) return;
      onActivityEvent(new Event("manual"));
    },
    extend,
    /** End the session now, in every tab. */
    signOut() {
      if (!machine) return;
      if (end("signout", false)) {
        send({ type: "expire", reason: "signout", at: now() });
      }
    },
    /**
     * End the session at a server time, such as a token's `exp`.
     * @param {IdleDeadline} expiresAt
     * @param {{ serverNow?: IdleDeadline }} [setOptions] - The server's
     *   current time, to correct a clock that is off. Without it, the
     *   device's clock is trusted.
     */
    setExpiresAt(expiresAt, setOptions) {
      if (!machine) return false;
      const deadline = toLocalDeadline(expiresAt, setOptions?.serverNow);
      if (!machine.setDeadline(deadline)) return false;
      send({ type: "deadline", at: now(), deadline });
      warned = false;
      evaluate();
      return true;
    },
    /** Begin a new session, such as after signing in again, in every tab. */
    reset() {
      if (!machine) return;
      const at = now();
      machine.reset(at);
      startedAt = lastBeat = at;
      remote = false;
      warned = false;
      send({ type: "reset", at });
      evaluate();
    },
    /** The time left, in ms. `Infinity` before `start()`. */
    remaining() {
      return machine ? machine.remaining(now()) : Number.POSITIVE_INFINITY;
    },
    /** The end of the session on this device's clock, or `null` before `start()`. */
    expiresAt() {
      return machine ? new Date(machine.snapshot().deadline) : null;
    },
  };
  return api;
}
