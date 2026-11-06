import {
  announce,
  type Announcer,
  ANNOUNCER_CLEAR_AFTER_MS,
  ANNOUNCER_READY_DELAY_MS,
  announceSourceStatus,
  createAnnouncer,
  createAnnouncerChannel,
  getAnnouncer,
  type SourceStatusEdge,
} from "../../src/utils/announcer.js";

const polite = () => document.querySelector('[role="status"]');
const assertive = () => document.querySelector('[role="alert"]');
const texts = (region: Element | null) =>
  [...(region?.children ?? [])].map((el) => el.textContent);

/** Move past the delay a new region waits before it takes a message. */
const ready = () => vi.advanceTimersByTime(ANNOUNCER_READY_DELAY_MS + 1);

describe("announcer", () => {
  let announcer: Announcer;

  beforeEach(() => {
    vi.useFakeTimers();
    announcer = createAnnouncer(document);
  });

  afterEach(() => {
    announcer.destroy();
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("makes no region until it is used, and none at import", () => {
    expect(document.querySelector("[data-announcer]")).toBeNull();
    announcer.announce("Hello");
    const root = document.querySelector("[data-announcer]");
    assert(root);
    expect(root).toHaveClass("bx--visually-hidden");
    expect(polite()).toHaveAttribute("aria-live", "polite");
    expect(polite()).toHaveAttribute("aria-atomic", "false");
    expect(polite()).toHaveAttribute("aria-relevant", "additions");
  });

  it("waits for a new region to be known before the first message", () => {
    announcer.announce("First");
    expect(texts(polite())).toEqual([]);
    vi.advanceTimersByTime(ANNOUNCER_READY_DELAY_MS - 1);
    expect(texts(polite())).toEqual([]);
    vi.advanceTimersByTime(2);
    expect(texts(polite())).toEqual(["First"]);
  });

  it("writes at once to a region that was acquired earlier", () => {
    const release = announcer.acquire();
    expect(polite()).toBeInTheDocument();
    ready();
    announcer.announce("Now");
    expect(texts(polite())).toEqual(["Now"]);
    release();
  });

  it("adds the same message twice as two elements", () => {
    announcer.acquire();
    ready();
    announcer.announce("Copied", { channel: "a" });
    announcer.announce("Copied", { channel: "b" });
    expect(texts(polite())).toEqual(["Copied", "Copied"]);
  });

  it("replaces a message on the same channel with a new element", () => {
    announcer.acquire();
    ready();
    announcer.announce("Copied");
    const first = polite()?.firstElementChild;
    announcer.announce("Copied");
    expect(texts(polite())).toEqual(["Copied"]);
    expect(polite()?.firstElementChild).not.toBe(first);
  });

  it("says only the latest message of a channel after a debounce", () => {
    announcer.acquire();
    ready();
    announcer.announce("12 results", { channel: "n", debounce: 500 });
    vi.advanceTimersByTime(300);
    announcer.announce("9 results", { channel: "n", debounce: 500 });
    vi.advanceTimersByTime(300);
    expect(texts(polite())).toEqual([]);
    vi.advanceTimersByTime(201);
    expect(texts(polite())).toEqual(["9 results"]);
  });

  it("throttles a steady stream to one message per gap", () => {
    announcer.acquire();
    ready();
    const region = polite();
    assert(region);
    const append = vi.spyOn(region, "append");
    // 100 messages a second for 10 seconds, at most one per 6 seconds.
    for (let i = 0; i < 1000; i++) {
      announcer.announce(`${i} new`, { channel: "tail", throttle: 6000 });
      vi.advanceTimersByTime(10);
    }
    const spoken = append.mock.calls.map(([el]) => (el as Element).textContent);
    expect(spoken).toHaveLength(2);
    expect(spoken[0]).toBe("0 new");
  });

  it("says nothing during a stream when a debounce is used as a throttle", () => {
    announcer.acquire();
    ready();
    const region = polite();
    assert(region);
    const append = vi.spyOn(region, "append");
    for (let i = 0; i < 1000; i++) {
      announcer.announce(`${i} new`, { channel: "tail", debounce: 6000 });
      vi.advanceTimersByTime(10);
    }
    expect(append).not.toHaveBeenCalled();
    vi.advanceTimersByTime(6000);
    expect(append).toHaveBeenCalledTimes(1);
  });

  it("skips a duplicate while it is in the region, and not after", () => {
    announcer.acquire();
    ready();
    announcer.announce("3 results", { channel: "n", dedupe: true });
    announcer.announce("3 results", { channel: "n", dedupe: true });
    expect(texts(polite())).toEqual(["3 results"]);
    announcer.announce("4 results", { channel: "n", dedupe: true });
    announcer.announce("3 results", { channel: "n", dedupe: true });
    expect(texts(polite())).toEqual(["3 results"]);
    vi.advanceTimersByTime(ANNOUNCER_CLEAR_AFTER_MS + 1);
    expect(texts(polite())).toEqual([]);
    announcer.announce("3 results", { channel: "n", dedupe: true });
    expect(texts(polite())).toEqual(["3 results"]);
  });

  it("keeps three channels apart", () => {
    announcer.acquire();
    ready();
    announcer.announce("a", { channel: "a" });
    announcer.announce("b", { channel: "b" });
    announcer.announce("c", { channel: "c" });
    announcer.announce("a2", { channel: "a" });
    expect(texts(polite())).toEqual(["b", "c", "a2"]);
  });

  it("removes a message after clearAfter", () => {
    announcer.acquire();
    ready();
    announcer.announce("Saved", { clearAfter: 1000 });
    expect(texts(polite())).toEqual(["Saved"]);
    vi.advanceTimersByTime(1001);
    expect(texts(polite())).toEqual([]);
  });

  it("treats an empty message as cancel", () => {
    announcer.acquire();
    ready();
    announcer.announce("Loading", { channel: "s", debounce: 500 });
    announcer.announce("", { channel: "s" });
    vi.advanceTimersByTime(600);
    expect(texts(polite())).toEqual([]);
    announcer.announce("Done", { channel: "s" });
    announcer.announce("", { channel: "s" });
    expect(texts(polite())).toEqual([]);
  });

  it("holds at most a dozen messages, dropping the oldest", () => {
    announcer.acquire();
    ready();
    for (let i = 0; i < 30; i++)
      announcer.announce(`m${i}`, { channel: `c${i}` });
    const kept = texts(polite());
    expect(kept).toHaveLength(12);
    expect(kept.at(-1)).toBe("m29");
  });

  it("makes the assertive region only when it is asked for", () => {
    announcer.acquire();
    ready();
    expect(assertive()).toBeNull();
    announcer.announce("Failed", { politeness: "assertive" });
    expect(assertive()).toHaveAttribute("aria-live", "assertive");
    ready();
    expect(texts(assertive())).toEqual(["Failed"]);
    expect(texts(polite())).toEqual([]);
  });

  it("keeps the regions while anyone holds them and removes them with the last", () => {
    const first = announcer.acquire();
    const second = announcer.acquire();
    first();
    first();
    expect(polite()).toBeInTheDocument();
    second();
    expect(document.querySelector("[data-announcer]")).toBeNull();
  });

  it("keeps the regions until a message has left them, then removes them", () => {
    const release = announcer.acquire();
    ready();
    announcer.announce("Saved", { clearAfter: 1000 });
    release();
    expect(polite()).toBeInTheDocument();
    vi.advanceTimersByTime(1001);
    expect(document.querySelector("[data-announcer]")).toBeNull();
  });

  it("removes the regions after the last message, without any holder", () => {
    announcer.announce("Once");
    ready();
    expect(polite()).toBeInTheDocument();
    vi.advanceTimersByTime(ANNOUNCER_CLEAR_AFTER_MS + 1);
    expect(document.querySelector("[data-announcer]")).toBeNull();
  });

  it("makes the region again when the page removed it", () => {
    announcer.acquire();
    ready();
    document.querySelector("[data-announcer]")?.remove();
    announcer.announce("Back");
    ready();
    expect(texts(polite())).toEqual(["Back"]);
  });

  it("puts a message about an element in a modal dialog inside the dialog", () => {
    document.body.innerHTML = `<main><button id="out">Out</button></main>
      <div role="dialog" aria-modal="true" id="dialog"><input id="in" /></div>`;
    const dialog = document.getElementById("dialog");
    const input = document.getElementById("in");
    const outside = document.getElementById("out");
    announcer.announce("In the dialog", { source: input });
    vi.advanceTimersByTime(ANNOUNCER_READY_DELAY_MS + 1);
    expect(texts(dialog?.querySelector('[role="status"]') ?? null)).toEqual([
      "In the dialog",
    ]);
    announcer.announce("On the page", { source: outside, channel: "page" });
    vi.advanceTimersByTime(ANNOUNCER_READY_DELAY_MS + 1);
    expect(
      texts(
        document.body.querySelector(
          ':scope > [data-announcer] > [role="status"]',
        ),
      ),
    ).toEqual(["On the page"]);
  });

  it("sends every message to a pushed host, and back after it pops", () => {
    document.body.innerHTML = `<div id="host"></div>`;
    const host = document.getElementById("host");
    assert(host);
    const pop = announcer.pushHost(host);
    ready();
    announcer.announce("Inside", { channel: "a" });
    expect(texts(host.querySelector('[role="status"]'))).toEqual(["Inside"]);
    // Saved, then the dialog closes: the message moves to the page.
    pop();
    host.remove();
    ready();
    expect(texts(polite())).toEqual(["Inside"]);
  });

  it("does not move a message that was heard before the host left", () => {
    document.body.innerHTML = `<div id="host"></div>`;
    const host = document.getElementById("host");
    assert(host);
    const pop = announcer.pushHost(host);
    ready();
    announcer.announce("Heard", { channel: "a" });
    vi.advanceTimersByTime(2000);
    pop();
    ready();
    expect(polite()).toBeNull();
  });
});

describe("announce and getAnnouncer", () => {
  afterEach(() => {
    getAnnouncer().destroy();
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("share one announcer per document", () => {
    vi.useFakeTimers();
    expect(getAnnouncer()).toBe(getAnnouncer(document));
    announce("Shared");
    vi.advanceTimersByTime(ANNOUNCER_READY_DELAY_MS + 1);
    expect(texts(polite())).toEqual(["Shared"]);
  });
});

describe("announceSourceStatus", () => {
  let announcer: Announcer;
  let emit: (edge: SourceStatusEdge) => void;

  const texts_ = {
    loading: () => "Loading",
    results: (count: number) => `${count} results`,
    more: (added: number) => `${added} more`,
    error: () => "Could not load",
  };

  beforeEach(() => {
    vi.useFakeTimers();
    announcer = getAnnouncer();
    announcer.acquire();
    ready();
  });

  afterEach(() => {
    announcer.destroy();
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  function connect() {
    return announceSourceStatus(
      (listener) => {
        emit = listener;
      },
      { ...texts_, channel: "src" },
    );
  }

  it("skips loading when the answer is quick, and says the count once", () => {
    connect();
    emit({ type: "loading", reason: "fetch" });
    vi.advanceTimersByTime(200);
    emit({ type: "success", count: 12, reason: "fetch" });
    vi.advanceTimersByTime(2000);
    expect(texts(polite())).toEqual(["12 results"]);
  });

  it("says loading when the answer is slow", () => {
    connect();
    emit({ type: "loading", reason: "fetch" });
    vi.advanceTimersByTime(501);
    expect(texts(polite())).toEqual(["Loading"]);
  });

  it("says nothing for a cached answer's loading edge, and not the same count twice", () => {
    connect();
    emit({ type: "loading", reason: "cache" });
    emit({ type: "success", count: 3, reason: "cache" });
    vi.advanceTimersByTime(501);
    emit({ type: "success", count: 3, reason: "fetch" });
    vi.advanceTimersByTime(501);
    expect(texts(polite())).toEqual(["3 results"]);
  });

  it("says how many a page added", () => {
    connect();
    emit({ type: "success", count: 20, reason: "fetch" });
    vi.advanceTimersByTime(501);
    emit({ type: "success", count: 35, reason: "more" });
    vi.advanceTimersByTime(501);
    expect(texts(polite())).toEqual(["15 more"]);
  });

  it("says a failure assertively and drops a waiting loading", () => {
    connect();
    ready();
    emit({ type: "loading", reason: "fetch" });
    emit({ type: "error" });
    vi.advanceTimersByTime(2000);
    expect(texts(assertive())).toEqual(["Could not load"]);
    expect(texts(polite())).toEqual([]);
  });

  it("says nothing for a cancel and stops when disconnected", () => {
    const stop = connect();
    emit({ type: "loading", reason: "fetch" });
    emit({ type: "idle", reason: "cancel" });
    vi.advanceTimersByTime(2000);
    expect(texts(polite())).toEqual([]);
    stop();
    expect(texts(polite())).toEqual([]);
  });
});

describe("createAnnouncerChannel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    getAnnouncer().destroy();
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("holds a message from init until the regions exist, then says it at once", () => {
    const channel = createAnnouncerChannel();
    channel.announce("No methods yet");
    expect(document.querySelector("[data-announcer]")).toBeNull();

    const disconnect = channel.connect();
    expect(texts(polite())).toEqual(["No methods yet"]);

    disconnect();
    expect(document.querySelector("[data-announcer]")).toBeNull();
  });

  it("says a held message after the next task when connect is never called", () => {
    const channel = createAnnouncerChannel();
    channel.announce("Late");
    vi.advanceTimersByTime(ANNOUNCER_READY_DELAY_MS + 1);
    expect(texts(polite())).toEqual(["Late"]);
  });

  it("keeps two instances on their own channels", () => {
    const first = createAnnouncerChannel();
    const second = createAnnouncerChannel();
    const stopFirst = first.connect();
    const stopSecond = second.connect();
    first.announce("one");
    second.announce("two");
    first.clear();
    expect(texts(polite())).toEqual(["two"]);
    stopFirst();
    stopSecond();
  });
});
