// @vitest-environment node
import { get } from "svelte/store";
import { createAutosave } from "../../src/utils/autosave.js";

describe("createAutosave on the server", () => {
  it("is safe to create, edit and subscribe to with no window", () => {
    expect(typeof window).toBe("undefined");
    const save = vi.fn();
    const autosave = createAutosave<string>(save);

    expect(get(autosave).status).toBe("idle");
    autosave.change("a");
    expect(get(autosave).status).toBe("unsaved");
    autosave.setOnline(false);
    autosave.destroy();
    expect(save).not.toHaveBeenCalled();
  });
});
