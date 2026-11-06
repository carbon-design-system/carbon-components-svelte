import { createStatusDisplay } from "../../src/SavingStatus/status-display.js";

function setup() {
  const shown: string[] = [];
  const display = createStatusDisplay((status) => shown.push(status), {
    savingDelay: 400,
    savingMinimum: 600,
    savedDelay: 250,
  });
  return { shown, display };
}

describe("createStatusDisplay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("applies the first status at once, with no timer", () => {
    const { shown, display } = setup();
    display("saving");
    expect(shown).toEqual(["saving"]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("never shows Saving for a save that ends within the delay", () => {
    const { shown, display } = setup();
    display("unsaved");
    display("saving");
    vi.advanceTimersByTime(300);
    display("saved");
    vi.advanceTimersByTime(1000);
    expect(shown).toEqual(["unsaved", "saved"]);
  });

  it("shows Saving after the delay, and holds it for the minimum", () => {
    const { shown, display } = setup();
    display("unsaved");
    display("saving");
    vi.advanceTimersByTime(400);
    expect(shown).toEqual(["unsaved", "saving"]);

    // Done 100 ms later: the spinner stays until it has shown 600 ms.
    vi.advanceTimersByTime(100);
    display("saved");
    vi.advanceTimersByTime(499);
    expect(shown).toEqual(["unsaved", "saving"]);
    vi.advanceTimersByTime(1);
    // Then Saved waits its own moment.
    vi.advanceTimersByTime(250);
    expect(shown).toEqual(["unsaved", "saving", "saved"]);
  });

  it("does not blink Saved when typing resumes within its delay", () => {
    const { shown, display } = setup();
    display("unsaved");
    display("saving");
    display("saved");
    vi.advanceTimersByTime(100);
    display("unsaved");
    vi.advanceTimersByTime(5000);
    expect(shown).toEqual(["unsaved"]);
  });

  it("shows an error after the spinner's minimum, and offline at once", () => {
    const { shown, display } = setup();
    display("saved");
    display("saving");
    vi.advanceTimersByTime(400);
    display("error");
    // The spinner is held for its minimum, and the error follows it.
    vi.advanceTimersByTime(600);
    expect(shown).toEqual(["saved", "saving", "error"]);

    display("offline");
    expect(shown.at(-1)).toBe("offline");
  });

  it("shows an error at once when the spinner never showed", () => {
    const { shown, display } = setup();
    display("saved");
    display("saving");
    display("error");
    expect(shown).toEqual(["saved", "error"]);
  });

  it("cancel drops the pending change", () => {
    const { shown, display } = setup();
    display("unsaved");
    display("saving");
    display.cancel();
    vi.advanceTimersByTime(1000);
    expect(shown).toEqual(["unsaved"]);
  });
});
