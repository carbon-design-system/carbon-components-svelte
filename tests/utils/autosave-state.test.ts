import {
  type AutosaveEvent,
  autosaveReduce,
  autosaveStatus,
  createAutosaveState,
  isAutosaveDirty,
} from "../../src/utils/autosave-state.js";

const run = (...events: AutosaveEvent[]) =>
  events.reduce(autosaveReduce, createAutosaveState());

const FAIL = { type: "failure", error: new Error("x"), retry: false } as const;
const RETRY = { type: "failure", error: new Error("x"), retry: true } as const;

describe("autosaveStatus", () => {
  it("is idle until something happens", () => {
    expect(autosaveStatus(createAutosaveState())).toBe("idle");
  });

  it("walks idle, unsaved, saving, saved", () => {
    expect(autosaveStatus(run({ type: "change" }))).toBe("unsaved");
    expect(autosaveStatus(run({ type: "change" }, { type: "start" }))).toBe(
      "saving",
    );
    expect(
      autosaveStatus(
        run({ type: "change" }, { type: "start" }, { type: "success", at: 1 }),
      ),
    ).toBe("saved");
  });

  it("starts saved when it was given a time", () => {
    expect(autosaveStatus(createAutosaveState({ savedAt: 5 }))).toBe("saved");
  });
});

describe("races", () => {
  it("keeps an edit made during a save dirty", () => {
    const state = run(
      { type: "change" },
      { type: "start" },
      { type: "change" },
      { type: "success", at: 1 },
    );
    expect(isAutosaveDirty(state)).toBe(true);
    // Not "saved": the newest edit is not in the request that finished.
    expect(autosaveStatus(state)).toBe("unsaved");
    expect(state.savedAt).toBe(1);
  });

  it("saves the newest edit with the next request", () => {
    const state = run(
      { type: "change" },
      { type: "start" },
      { type: "change" },
      { type: "success", at: 1 },
      { type: "start" },
      { type: "success", at: 2 },
    );
    expect(autosaveStatus(state)).toBe("saved");
    expect(state.savedAt).toBe(2);
  });

  it("holds a failure that ran out of retries through an edit", () => {
    const failed = run({ type: "change" }, { type: "start" }, FAIL);
    expect(autosaveStatus(failed)).toBe("error");
    expect(failed.error).toBeInstanceOf(Error);

    // The error says what happened to the last save. An edit does not
    // change that, so the status does not flip back to "unsaved".
    const edited = autosaveReduce(failed, { type: "change" });
    expect(autosaveStatus(edited)).toBe("error");

    // The next request starts a fresh chain of attempts, and the error stays
    // until it works.
    const retrying = autosaveReduce(edited, { type: "start" });
    expect(retrying.attempts).toBe(0);
    expect(autosaveStatus(retrying)).toBe("saving");
    expect(
      autosaveStatus(autosaveReduce(retrying, { type: "success", at: 3 })),
    ).toBe("saved");
  });

  it("does not show a failure that will be retried as an error", () => {
    const state = run({ type: "change" }, { type: "start" }, RETRY);
    expect(autosaveStatus(state)).toBe("saving");
    expect(state.attempts).toBe(1);
    expect(state.failed).toBe(false);
  });

  it("counts attempts until a success", () => {
    const state = run(
      { type: "change" },
      { type: "start" },
      RETRY,
      { type: "start" },
      RETRY,
      { type: "start" },
      FAIL,
    );
    expect(state.attempts).toBe(3);
    expect(autosaveStatus(state)).toBe("error");
    expect(autosaveReduce(state, { type: "start" }).attempts).toBe(0);
  });

  it("does not count a failure that the network caused", () => {
    const state = run(
      { type: "change" },
      { type: "start" },
      { type: "offline" },
      FAIL,
    );
    expect(autosaveStatus(state)).toBe("offline");
    expect(state.attempts).toBe(0);
    expect(state.failed).toBe(false);
    expect(state.retrying).toBe(true);
  });

  it("resumes after offline mid-save, and saves", () => {
    const offline = run(
      { type: "change" },
      { type: "start" },
      { type: "offline" },
      FAIL,
    );
    const back = autosaveReduce(offline, { type: "online" });
    expect(autosaveStatus(back)).toBe("saving");
    expect(
      autosaveStatus(
        autosaveReduce(autosaveReduce(back, { type: "start" }), {
          type: "success",
          at: 9,
        }),
      ),
    ).toBe("saved");
  });

  it("lets a save that finishes after the network dropped count", () => {
    const state = run(
      { type: "change" },
      { type: "start" },
      { type: "offline" },
      { type: "success", at: 4 },
    );
    // Nothing is waiting, so being offline is not news.
    expect(autosaveStatus(state)).toBe("saved");
  });

  it("shows offline for an edit made while offline, and for an error", () => {
    expect(autosaveStatus(run({ type: "offline" }, { type: "change" }))).toBe(
      "offline",
    );
    expect(
      autosaveStatus(
        run({ type: "change" }, { type: "start" }, FAIL, { type: "offline" }),
      ),
    ).toBe("offline");
  });

  it("stays quiet offline when nothing is unsaved", () => {
    expect(autosaveStatus(run({ type: "offline" }))).toBe("idle");
  });

  it("ignores a repeated online or offline event", () => {
    const state = createAutosaveState();
    expect(autosaveReduce(state, { type: "online" })).toBe(state);
    const offline = autosaveReduce(state, { type: "offline" });
    expect(autosaveReduce(offline, { type: "offline" })).toBe(offline);
  });

  it("takes the current value as saved on reset, and drops a failure", () => {
    const state = autosaveReduce(
      run({ type: "change" }, { type: "start" }, FAIL),
      { type: "reset" },
    );
    expect(autosaveStatus(state)).toBe("idle");
    expect(state.error).toBeUndefined();
    expect(state.attempts).toBe(0);
  });
});
