import { get } from "svelte/store";
import {
  createIdleMachine,
  createIdleTimer,
  type IdleTimer,
  type IdleTimerOptions,
} from "../../src/utils/idle-timer.js";

const MIN = 60_000;
const T0 = 1_700_000_000_000;

describe("createIdleMachine", () => {
  const machine = () =>
    createIdleMachine({ timeout: 15 * MIN, warnBefore: 2 * MIN, startAt: T0 });

  it("derives the status from the time it is asked about", () => {
    const m = machine();
    expect(m.status(T0)).toBe("active");
    expect(m.status(T0 + 12 * MIN)).toBe("active");
    expect(m.status(T0 + 13 * MIN)).toBe("warning");
    expect(m.status(T0 + 15 * MIN)).toBe("expired");
    // A jump over the whole session, as after a lid closed for an hour.
    expect(m.status(T0 + 60 * MIN)).toBe("expired");
  });

  it("slides the deadline for activity while active", () => {
    const m = machine();
    expect(m.activity(T0 + 10 * MIN)).toBe(true);
    expect(m.snapshot().deadline).toBe(T0 + 25 * MIN);
  });

  it("judges activity at its own time, not the time it arrives", () => {
    const m = machine();
    // From before the warning: still counts, however late it is handled.
    expect(m.activity(T0 + 12 * MIN)).toBe(true);
    // From inside the warning: never does.
    expect(m.activity(T0 + 12 * MIN + 30 * 60_000)).toBe(false);
    const w = machine();
    expect(w.activity(T0 + 14 * MIN)).toBe(false);
    expect(w.snapshot().deadline).toBe(T0 + 15 * MIN);
  });

  it("does not move on activity once a server set the deadline", () => {
    const m = machine();
    m.setDeadline(T0 + 30 * MIN);
    expect(m.activity(T0 + MIN)).toBe(false);
    expect(m.snapshot().deadline).toBe(T0 + 30 * MIN);
    expect(m.snapshot().serverDriven).toBe(true);
  });

  it("refuses to extend after the deadline, and stays expired", () => {
    const m = machine();
    expect(m.extend(T0 + 15 * MIN)).toBe(false);
    m.expire("timeout");
    expect(m.extend(T0 + MIN)).toBe(false);
    expect(m.expire("signout")).toBe(false);
    m.reset(T0 + 20 * MIN);
    expect(m.status(T0 + 21 * MIN)).toBe("active");
  });
});

class FakeBroadcastChannel {
  static channels = new Set<FakeBroadcastChannel>();
  static frozen = new Set<FakeBroadcastChannel>();
  onmessage: ((event: { data: unknown }) => void) | null = null;
  readonly name: string;
  constructor(name: string) {
    this.name = name;
    FakeBroadcastChannel.channels.add(this);
  }
  postMessage(data: unknown) {
    for (const peer of FakeBroadcastChannel.channels) {
      if (peer === this || peer.name !== this.name) continue;
      if (FakeBroadcastChannel.frozen.has(peer)) continue;
      queueMicrotask(() => peer.onmessage?.({ data: structuredClone(data) }));
    }
  }
  close() {
    FakeBroadcastChannel.channels.delete(this);
  }
}

const flush = () => vi.advanceTimersByTimeAsync(0);

describe("createIdleTimer", () => {
  const started: IdleTimer[] = [];

  function make(options: Partial<IdleTimerOptions> = {}) {
    const timer = createIdleTimer({
      timeout: 15 * MIN,
      warnBefore: 2 * MIN,
      ...options,
    });
    timer.start();
    started.push(timer);
    return timer;
  }

  const press = () =>
    document.body.dispatchEvent(new Event("keydown", { bubbles: true }));

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T0);
    localStorage.clear();
    vi.stubGlobal("BroadcastChannel", FakeBroadcastChannel);
  });

  afterEach(() => {
    for (const timer of started.splice(0)) timer.stop();
    FakeBroadcastChannel.channels.clear();
    FakeBroadcastChannel.frozen.clear();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("warns two minutes before a 15 minute session ends", () => {
    const onWarn = vi.fn();
    const onExpire = vi.fn();
    const timer = make({ onWarn, onExpire });
    expect(get(timer).status).toBe("active");

    vi.advanceTimersByTime(13 * MIN - 1);
    expect(get(timer).status).toBe("active");
    vi.advanceTimersByTime(1);
    expect(get(timer).status).toBe("warning");
    expect(get(timer).expiresAt).toEqual(new Date(T0 + 15 * MIN));
    expect(onWarn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(2 * MIN);
    expect(get(timer)).toMatchObject({
      status: "expired",
      reason: "timeout",
      remote: false,
    });
    expect(onExpire).toHaveBeenCalledWith({ reason: "timeout", remote: false });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("slides the end on activity, and a throttled event does nothing", () => {
    const timer = make();
    vi.advanceTimersByTime(10 * MIN);
    press();
    expect(timer.expiresAt()).toEqual(new Date(T0 + 25 * MIN));
    vi.advanceTimersByTime(500);
    press();
    expect(timer.expiresAt()).toEqual(new Date(T0 + 25 * MIN));
    vi.advanceTimersByTime(12 * MIN);
    expect(get(timer).status).toBe("active");
    vi.advanceTimersByTime(MIN);
    expect(get(timer).status).toBe("warning");
  });

  it("listens for activity with passive capture listeners", () => {
    const add = vi.spyOn(window, "addEventListener");
    make();
    const calls = add.mock.calls.filter(([type]) =>
      ["pointerdown", "keydown", "scroll"].includes(type),
    );
    expect(calls.map(([type]) => type).sort()).toEqual([
      "keydown",
      "pointerdown",
      "scroll",
    ]);
    for (const [, , options] of calls) {
      expect(options).toMatchObject({ capture: true, passive: true });
    }
  });

  it("does not let activity dismiss the warning; extend does", async () => {
    const timer = make();
    vi.advanceTimersByTime(14 * MIN);
    expect(get(timer).status).toBe("warning");
    press();
    vi.advanceTimersByTime(2000);
    press();
    expect(get(timer).status).toBe("warning");
    expect(timer.expiresAt()).toEqual(new Date(T0 + 15 * MIN));

    await expect(timer.extend()).resolves.toBe(true);
    expect(get(timer).status).toBe("active");
    expect(timer.expiresAt()).toEqual(
      new Date(T0 + 14 * MIN + 2000 + 15 * MIN),
    );
  });

  it("does not revive an expired session", async () => {
    const timer = make();
    vi.advanceTimersByTime(15 * MIN);
    press();
    await expect(timer.extend()).resolves.toBe(false);
    expect(get(timer).status).toBe("expired");
  });

  it("is right after a sleep, from the clock, with no timer having run", () => {
    const onExpire = vi.fn();
    const timer = make({ onExpire });
    // The lid closes at 5 minutes and opens an hour later. No timer fired.
    vi.setSystemTime(T0 + 65 * MIN);
    expect(timer.remaining()).toBe(0);
    document.dispatchEvent(new Event("visibilitychange"));
    expect(get(timer).status).toBe("expired");
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("shows the real time left when it wakes inside the warning", () => {
    const timer = make();
    vi.setSystemTime(T0 + 14 * MIN + 10_000);
    window.dispatchEvent(new Event("focus"));
    expect(get(timer).status).toBe("warning");
    expect(timer.remaining()).toBe(50_000);
  });

  it("does not count the return of a slept tab as activity", () => {
    const timer = make();
    vi.setSystemTime(T0 + 14 * MIN);
    document.dispatchEvent(new Event("visibilitychange"));
    expect(get(timer).status).toBe("warning");
    expect(timer.expiresAt()).toEqual(new Date(T0 + 15 * MIN));
  });

  it("ignores a tab becoming hidden", () => {
    const timer = make();
    vi.advanceTimersByTime(5 * MIN);
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    document.dispatchEvent(new Event("visibilitychange"));
    expect(timer.expiresAt()).toEqual(new Date(T0 + 15 * MIN));
    hidden.mockReturnValue(false);
    vi.advanceTimersByTime(2000);
    document.dispatchEvent(new Event("visibilitychange"));
    expect(timer.expiresAt()).toEqual(new Date(T0 + 5 * MIN + 2000 + 15 * MIN));
  });

  describe("server-driven expiry", () => {
    it("ends at the given time and ignores activity", () => {
      const timer = make({ timeout: undefined, expiresAt: T0 + 10 * MIN });
      vi.advanceTimersByTime(5 * MIN);
      press();
      expect(timer.expiresAt()).toEqual(new Date(T0 + 10 * MIN));
      vi.advanceTimersByTime(3 * MIN);
      expect(get(timer).status).toBe("warning");
      vi.advanceTimersByTime(2 * MIN);
      expect(get(timer).status).toBe("expired");
    });

    it("moves with setExpiresAt, which brings back a warned session", () => {
      const timer = make({ timeout: undefined, expiresAt: T0 + 10 * MIN });
      vi.advanceTimersByTime(9 * MIN);
      expect(get(timer).status).toBe("warning");
      timer.setExpiresAt(new Date(T0 + 40 * MIN));
      expect(get(timer).status).toBe("active");
      vi.advanceTimersByTime(29 * MIN);
      expect(get(timer).status).toBe("warning");
    });

    it("corrects a clock that is off by the server's time", () => {
      // The server says it is 10 minutes ahead of this device's clock.
      const timer = make({ timeout: undefined, expiresAt: T0 + 30 * MIN });
      timer.setExpiresAt(T0 + 25 * MIN, { serverNow: T0 + 10 * MIN });
      expect(timer.expiresAt()).toEqual(new Date(T0 + 15 * MIN));
      const created = make({
        timeout: undefined,
        expiresAt: T0 + 25 * MIN,
        serverNow: T0 + 10 * MIN,
      });
      expect(created.expiresAt()).toEqual(new Date(T0 + 15 * MIN));
    });

    it("needs a timeout or an expiresAt", () => {
      expect(() => createIdleTimer({})).toThrow(TypeError);
    });
  });

  describe("onExtend", () => {
    it("is asked when the user stays, and its end time wins", async () => {
      const onExtend = vi.fn(() =>
        Promise.resolve({ expiresAt: T0 + 14 * MIN + 30 * MIN }),
      );
      const timer = make({ onExtend });
      vi.advanceTimersByTime(14 * MIN);
      const pending = timer.extend();
      expect(get(timer).extending).toBe(true);
      await pending;
      expect(onExtend).toHaveBeenCalledWith({ reason: "user" });
      expect(get(timer)).toMatchObject({ status: "active", extending: false });
      expect(timer.expiresAt()).toEqual(new Date(T0 + 44 * MIN));
    });

    it("keeps the warning up and reports when the server fails", async () => {
      const failure = new Error("503");
      const onError = vi.fn();
      const timer = make({
        onExtend: () => Promise.reject(failure),
        onError,
      });
      vi.advanceTimersByTime(14 * MIN);
      await expect(timer.extend()).resolves.toBe(false);
      expect(get(timer)).toMatchObject({
        status: "warning",
        extending: false,
        error: failure,
      });
      expect(onError).toHaveBeenCalledWith(failure);
    });

    it("lets a late reply fall away once the session ended", async () => {
      let reply: (value: void) => void = () => {};
      const timer = make({
        onExtend: () => new Promise<void>((resolve) => (reply = resolve)),
      });
      vi.advanceTimersByTime(14 * MIN);
      const pending = timer.extend();
      vi.advanceTimersByTime(MIN);
      reply();
      await expect(pending).resolves.toBe(false);
      expect(get(timer).status).toBe("expired");
    });

    it("is a heartbeat for activity, no more often than `heartbeat`", async () => {
      const onExtend = vi.fn();
      make({ onExtend, heartbeat: 5 * MIN });
      vi.advanceTimersByTime(MIN);
      press();
      expect(onExtend).not.toHaveBeenCalled();
      vi.advanceTimersByTime(4 * MIN);
      press();
      expect(onExtend).toHaveBeenCalledTimes(1);
      expect(onExtend).toHaveBeenCalledWith({ reason: "activity" });
      vi.advanceTimersByTime(2000);
      press();
      expect(onExtend).toHaveBeenCalledTimes(1);
      await flush();
    });
  });

  describe("across tabs", () => {
    it("lets activity in one tab extend the other", async () => {
      const a = make({ crossTab: true });
      const b = make({ crossTab: true });
      vi.advanceTimersByTime(10 * MIN);
      a.activity();
      await flush();
      expect(b.expiresAt()).toEqual(new Date(T0 + 25 * MIN));
      vi.advanceTimersByTime(14 * MIN);
      expect(get(b).status).toBe("warning");
      expect(get(a).status).toBe("warning");
    });

    it("shows the warning in both and closes it when one extends", async () => {
      const a = make({ crossTab: true });
      const b = make({ crossTab: true });
      vi.advanceTimersByTime(14 * MIN);
      expect(get(a).status).toBe("warning");
      expect(get(b).status).toBe("warning");
      await a.extend();
      await flush();
      expect(get(a).status).toBe("active");
      expect(get(b).status).toBe("active");
      expect(b.expiresAt()).toEqual(a.expiresAt());
    });

    it("signs every tab out when one signs out", async () => {
      const onExpireA = vi.fn();
      const onExpireB = vi.fn();
      const a = make({ crossTab: true, onExpire: onExpireA });
      const b = make({ crossTab: true, onExpire: onExpireB });
      a.signOut();
      await flush();
      expect(get(b)).toMatchObject({
        status: "expired",
        reason: "signout",
        remote: true,
      });
      expect(onExpireA).toHaveBeenCalledWith({
        reason: "signout",
        remote: false,
      });
      expect(onExpireB).toHaveBeenCalledWith({
        reason: "signout",
        remote: true,
      });
    });

    it("does not let a stale timeout end a session another tab extended", async () => {
      const a = make({ crossTab: true });
      const b = make({ crossTab: true });
      vi.advanceTimersByTime(14 * MIN);
      // B's user stayed, but A is a frozen tab that has not heard of it.
      FakeBroadcastChannel.frozen = new Set(FakeBroadcastChannel.channels);
      await b.extend();
      // A's timer reaches its old deadline: it reads the stored extension
      // before it signs anyone out.
      vi.advanceTimersByTime(MIN + 1000);
      expect(get(a).status).toBe("active");
      expect(get(b).status).toBe("active");
    });

    it("reads the stored extension when a frozen tab is shown again", async () => {
      const a = make({ crossTab: true });
      const b = make({ crossTab: true });
      vi.advanceTimersByTime(14 * MIN);
      FakeBroadcastChannel.frozen = new Set(FakeBroadcastChannel.channels);
      await b.extend();
      vi.setSystemTime(T0 + 15 * MIN + 1000);
      window.dispatchEvent(new Event("focus"));
      expect(get(a).status).toBe("active");
    });

    it("ignores a timeout from a tab that used an older deadline", async () => {
      const a = make({ crossTab: true });
      const b = make({ crossTab: true });
      vi.advanceTimersByTime(10 * MIN);
      a.activity();
      await flush();
      // B's old end arrives late at A.
      const channel = [...FakeBroadcastChannel.channels][1];
      channel.postMessage({
        type: "expire",
        reason: "timeout",
        at: T0 + 15 * MIN,
        id: "other",
      });
      await flush();
      expect(get(a).status).toBe("active");
      expect(get(b).status).toBe("active");
    });

    it("falls back to storage events without BroadcastChannel", () => {
      vi.stubGlobal("BroadcastChannel", undefined);
      const a = make({ crossTab: true, channelName: "idle-test" });
      const b = make({ crossTab: true, channelName: "idle-test" });
      expect(FakeBroadcastChannel.channels.size).toBe(0);
      a.signOut();
      // The browser fires `storage` in the other tabs; here, in this one.
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "idle-test",
          newValue: localStorage.getItem("idle-test"),
        }),
      );
      expect(get(b)).toMatchObject({ status: "expired", remote: true });
      expect(get(a)).toMatchObject({ status: "expired", remote: false });
    });

    it("starts a new session in every tab on reset", async () => {
      const a = make({ crossTab: true });
      const b = make({ crossTab: true });
      a.signOut();
      await flush();
      expect(get(b).status).toBe("expired");
      vi.advanceTimersByTime(MIN);
      a.reset();
      await flush();
      expect(get(a).status).toBe("active");
      expect(get(b).status).toBe("active");
    });

    it("ignores a sign-out left over from an earlier session", () => {
      localStorage.setItem(
        "carbon-idle-timer",
        JSON.stringify({
          type: "expire",
          reason: "signout",
          at: T0 - MIN,
          id: "x",
          n: 1,
        }),
      );
      const timer = make({ crossTab: true });
      window.dispatchEvent(new Event("focus"));
      expect(get(timer).status).toBe("active");
    });
  });

  it("releases its listeners, timer and channel on stop", () => {
    const timer = make({ crossTab: true });
    expect(vi.getTimerCount()).toBe(1);
    expect(FakeBroadcastChannel.channels.size).toBe(1);
    const stop = timer.start();
    stop();
    expect(vi.getTimerCount()).toBe(0);
    expect(FakeBroadcastChannel.channels.size).toBe(0);
    press();
    expect(vi.getTimerCount()).toBe(0);
  });
});
