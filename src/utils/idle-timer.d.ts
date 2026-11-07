import type { Readable } from "svelte/store";

export type IdleStatus = "active" | "warning" | "expired";
export type IdleExpireReason = "timeout" | "signout";
export type IdleDeadline = Date | number;
export type IdleExtendResult =
  IdleDeadline | { expiresAt: IdleDeadline; serverNow?: IdleDeadline };

/** The events that count as activity unless `events` says otherwise. */
export const IDLE_EVENTS: readonly string[];

export interface IdleState {
  status: IdleStatus;
  /**
   * When the session ends on this device's clock. Only set while the
   * status is not `"active"`.
   */
  expiresAt: Date | null;
  /** Why it expired. */
  reason: IdleExpireReason | null;
  /** Whether another tab expired it. */
  remote: boolean;
  /** Whether `onExtend` is running for a request from the user. */
  extending: boolean;
  /** What the last `onExtend` for the user threw. */
  error: unknown;
}

export interface IdleTimerOptions {
  /**
   * Idle time in ms before the user is signed out.
   * Required unless `expiresAt` is set.
   */
  timeout?: number;
  /**
   * Warn this long before the end, in ms. Default 120000.
   * WCAG 2.2.1 wants at least 20 seconds.
   */
  warnBefore?: number;
  /**
   * End the session at this time instead, such as a token's `exp`.
   * Activity then does not move it.
   */
  expiresAt?: IdleDeadline;
  /** The server's current time for `expiresAt`, to correct a clock that is off. */
  serverNow?: IdleDeadline;
  /** Events that count as activity. */
  events?: ReadonlyArray<string>;
  /** Ignore activity within this many ms of the last one counted. Default 1000. */
  throttle?: number;
  /**
   * Share activity, extension and sign-out with the other tabs of this
   * origin.
   */
  crossTab?: boolean;
  /**
   * Names the channel and storage key that `crossTab` uses.
   * Default `"carbon-idle-timer"`.
   */
  channelName?: string;
  /**
   * With `onExtend`, call it for activity at most this often, in ms.
   * `false` to call it only when the user chooses to stay.
   */
  heartbeat?: number | false;
  /**
   * Tell the server the user is here. Return the new end of the session if
   * the server sets it; return nothing for `timeout` from now. A throw
   * keeps the warning up.
   */
  onExtend?: (info: {
    reason: "user" | "activity";
  }) => void | IdleExtendResult | Promise<void | IdleExtendResult>;
  /** The warning started. */
  onWarn?: () => void;
  /**
   * The session ended. It runs in every tab; call the server once, for
   * `remote: false`.
   */
  onExpire?: (info: { reason: IdleExpireReason; remote: boolean }) => void;
  /** `onExtend` threw. */
  onError?: (error: unknown) => void;
  /** The clock, in ms. Default `Date.now`. */
  now?: () => number;
}

export interface IdleTimer extends Readable<IdleState> {
  /** Start watching. Does nothing on the server, and when already started. */
  start(): () => void;
  /** Stop watching and release the listeners, timer and channel. */
  stop(): void;
  /**
   * Count activity now, such as for input the listeners cannot see.
   * Ignored once the warning has started.
   */
  activity(): void;
  /**
   * Keep the session going. With `onExtend`, the server is asked first.
   * Resolves to whether the session was extended.
   */
  extend(reason?: "user" | "activity"): Promise<boolean>;
  /** End the session now, in every tab. */
  signOut(): void;
  /**
   * End the session at a server time, such as a token's `exp`. Pass the
   * server's current time as `serverNow` to correct a clock that is off.
   */
  setExpiresAt(
    expiresAt: IdleDeadline,
    options?: { serverNow?: IdleDeadline },
  ): boolean;
  /** Begin a new session, such as after signing in again, in every tab. */
  reset(): void;
  /** The time left, in ms. `Infinity` before `start()`. */
  remaining(): number;
  /** The end of the session on this device's clock, or `null` before `start()`. */
  expiresAt(): Date | null;
}

/**
 * The pure core of the idle timer. It owns no timers and reads no clock:
 * every method takes the time to judge at.
 */
export interface IdleMachine {
  status(at: number): IdleStatus;
  remaining(at: number): number;
  activity(at: number): boolean;
  extend(at: number, deadline?: number): boolean;
  setDeadline(deadline: number): boolean;
  expire(reason: IdleExpireReason): boolean;
  reset(at: number, deadline?: number): void;
  snapshot(): {
    deadline: number;
    expired: IdleExpireReason | null;
    serverDriven: boolean;
    lastActivity: number;
  };
  nextBoundary(at: number): number | null;
}

export function createIdleMachine(options: {
  timeout?: number;
  warnBefore?: number;
  startAt: number;
  deadline?: number;
}): IdleMachine;

/**
 * Watch for a user who has gone idle, warn before the session ends, and end
 * it. A Svelte store of {@link IdleState} with methods.
 *
 * Nothing runs until `start()`, and `start()` does nothing on the server.
 * Time is judged by the wall clock at every check, so a hidden tab whose
 * timers are throttled, or a laptop that slept, is right as soon as it wakes.
 */
export function createIdleTimer(options: IdleTimerOptions): IdleTimer;
