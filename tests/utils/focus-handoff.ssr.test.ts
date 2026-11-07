// @vitest-environment node
import { captureFocusTarget } from "../../src/utils/focus-handoff.js";

describe("focus-handoff on the server", () => {
  it("imports and captures with no document", async () => {
    expect(typeof document).toBe("undefined");

    const restore = captureFocusTarget({} as HTMLElement);

    expect(await restore()).toBe(false);
  });
});
