import {
  ANNOUNCER_CLEAR_AFTER_MS,
  ANNOUNCER_READY_DELAY_MS,
} from "../../src/constants/timing.js";
import {
  announce,
  type Announcer,
  createAnnouncer,
  createAnnouncerChannel,
  getAnnouncer,
} from "../../src/utils/announcer.js";

const polite = () => document.querySelector('[role="status"]');
const texts = (region: Element | null | undefined) =>
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

  it("makes its region on the first message, and waits before writing to it", () => {
    expect(document.querySelector("[data-announcer]")).toBeNull();
    announcer.announce("First");
    const root = document.querySelector("[data-announcer]");
    assert(root);
    expect(root).toHaveClass("bx--visually-hidden");
    expect(polite()).toHaveAttribute("aria-live", "polite");
    expect(polite()).toHaveAttribute("aria-atomic", "false");
    expect(polite()).toHaveAttribute("aria-relevant", "additions");

    vi.advanceTimersByTime(ANNOUNCER_READY_DELAY_MS - 1);
    expect(texts(polite())).toEqual([]);
    vi.advanceTimersByTime(2);
    expect(texts(polite())).toEqual(["First"]);
  });

  it("writes at once to a region a holder made, and a repeat as a new element", () => {
    announcer.acquire();
    announcer.announce("Copied");
    const first = polite()?.firstElementChild;
    announcer.announce("Copied");
    expect(texts(polite())).toEqual(["Copied"]);
    expect(polite()?.firstElementChild).not.toBe(first);
  });

  it("keeps channels apart", () => {
    announcer.acquire();
    ready();
    announcer.announce("a", { channel: "a" });
    announcer.announce("b", { channel: "b" });
    announcer.announce("a2", { channel: "a" });
    expect(texts(polite())).toEqual(["b", "a2"]);
  });

  it("says only the latest message of a channel after a debounce", () => {
    announcer.acquire();
    ready();
    announcer.announce("12 results", { channel: "n", debounce: 500 });
    vi.advanceTimersByTime(300);
    announcer.announce("9 results", { channel: "n", debounce: 500 });
    vi.advanceTimersByTime(499);
    expect(texts(polite())).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(texts(polite())).toEqual(["9 results"]);
  });

  it("clears a channel's waiting and spoken message on an empty message", () => {
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

  it("removes a message after its time, and the region with the last one", () => {
    announcer.announce("Once");
    ready();
    expect(texts(polite())).toEqual(["Once"]);
    vi.advanceTimersByTime(ANNOUNCER_CLEAR_AFTER_MS);
    expect(document.querySelector("[data-announcer]")).toBeNull();
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

  it("keeps the region while anyone holds it", () => {
    const first = announcer.acquire();
    const second = announcer.acquire();
    first();
    first();
    expect(polite()).toBeInTheDocument();
    second();
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
    announcer.announce("In the dialog", {
      source: document.getElementById("in"),
    });
    ready();
    expect(texts(dialog?.querySelector('[role="status"]'))).toEqual([
      "In the dialog",
    ]);

    announcer.announce("On the page", {
      source: document.getElementById("out"),
      channel: "page",
    });
    ready();
    expect(
      texts(
        document.body.querySelector(
          ':scope > [data-announcer] [role="status"]',
        ),
      ),
    ).toEqual(["On the page"]);
  });

  it("writes to an adopted region instead of making one", () => {
    document.body.innerHTML = `<div role="status" id="own"></div>`;
    const own = document.getElementById("own");
    assert(own);
    const release = announcer.adopt(own);
    announcer.announce("Saved");
    expect(texts(own)).toEqual(["Saved"]);
    expect(document.querySelector("[data-announcer]")).toBeNull();

    release();
    expect(texts(own)).toEqual([]);
  });
});

describe("announce", () => {
  afterEach(() => {
    getAnnouncer().destroy();
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("writes to the document's shared announcer", () => {
    vi.useFakeTimers();
    expect(getAnnouncer()).toBe(getAnnouncer(document));
    announce("Shared");
    ready();
    expect(texts(polite())).toEqual(["Shared"]);
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

  it("holds a message from init until connect, which makes the region", () => {
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
    vi.advanceTimersByTime(0);
    ready();
    expect(texts(polite())).toEqual(["Late"]);
  });

  it("keeps two instances on their own channels", () => {
    const first = createAnnouncerChannel();
    const second = createAnnouncerChannel();
    const stopFirst = first.connect();
    const stopSecond = second.connect();
    ready();
    first.announce("one");
    second.announce("two");
    first.clear();
    expect(texts(polite())).toEqual(["two"]);
    stopFirst();
    stopSecond();
  });
});
