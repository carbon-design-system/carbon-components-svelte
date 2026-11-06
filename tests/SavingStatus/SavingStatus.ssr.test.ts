// @vitest-environment node
import SavingStatus from "carbon-components-svelte/SavingStatus/SavingStatus.svelte";
import { createAutosave } from "../../src/utils/autosave.js";
import { renderSSR } from "../utils/ssr";

describe("SavingStatus server render", () => {
  it.each([
    ["unsaved", "Unsaved changes"],
    ["saving", "Saving…"],
    ["saved", "Saved"],
    ["error", "Couldn't save"],
  ] as const)(
    "renders %s with its text and silent live regions",
    (status, text) => {
      const { document } = renderSSR(SavingStatus, { status });

      expect(
        document.querySelector(".bx--saving-status")?.textContent,
      ).toContain(text);
      // Nothing is announced for what the server renders.
      expect(document.querySelector('[role="status"]')?.textContent).toBe("");
      expect(document.querySelector('[role="alert"]')?.textContent).toBe("");
    },
  );

  it("renders a spinner at once for a status that is already saving", () => {
    const { document } = renderSSR(SavingStatus, { status: "saving" });
    expect(document.querySelector(".bx--inline-loading")).not.toBeNull();
    expect(document.querySelector(".bx--inline-loading--delayed")).toBeNull();
  });

  it("says Saved without the age, so the client can agree", () => {
    const { document } = renderSSR(SavingStatus, {
      status: "saved",
      savedAt: Date.now() - 10 * 60_000,
      locale: "en-US",
    });
    expect(document.querySelector("time")?.textContent?.trim()).toBe("Saved");
  });

  it("renders from an autosave store with no window", () => {
    const autosave = createAutosave<string>(async () => {});
    autosave.change("a");
    const { document } = renderSSR(SavingStatus, { autosave });
    expect(document.querySelector(".bx--saving-status")?.textContent).toContain(
      "Unsaved changes",
    );
    autosave.destroy();
  });
});
