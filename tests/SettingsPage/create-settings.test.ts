// @vitest-environment node
import { createSettings } from "carbon-components-svelte/SettingsPage/create-settings.js";
import { get } from "svelte/store";

function create(options = {}) {
  return createSettings(
    { name: "Priya", tags: ["a"], email: true },
    { defaults: { name: "", email: true }, ...options },
  );
}

describe("createSettings", () => {
  it("tracks the fields that differ from the saved values", () => {
    const settings = create();
    const seen: number[] = [];
    const stop = settings.changed.subscribe((count) => seen.push(count));

    settings.values.update((v) => ({ ...v, name: "P" }));
    settings.values.update((v) => ({ ...v, name: "Pr" }));
    settings.values.update((v) => ({ ...v, tags: ["a", "b"] }));
    settings.values.update((v) => ({ ...v, name: "Priya", tags: ["a"] }));

    expect(seen).toEqual([0, 1, 2, 0]);
    expect(get(settings.dirty)).toBe(false);
    stop();
  });

  it("emits a new modified set only when its members change", () => {
    const settings = create();
    let emissions = 0;
    const stop = settings.modified.subscribe(() => emissions++);
    settings.values.update((v) => ({ ...v, name: "a" }));
    settings.values.update((v) => ({ ...v, name: "ab" }));
    settings.values.update((v) => ({ ...v, name: "abc" }));
    expect(emissions).toBe(2);
    stop();
  });

  it("resets a field to its default and not to the saved value", () => {
    const settings = create();
    expect([...get(settings.customized)]).toEqual(["name"]);
    settings.resetField("name");
    expect(get(settings.values).name).toBe("");
    expect(get(settings.customized).size).toBe(0);
    expect(get(settings.modified).has("name")).toBe(true);
  });

  it("discards to the saved values", () => {
    const settings = create();
    settings.values.update((v) => ({ ...v, name: "x", email: false }));
    settings.discard();
    expect(get(settings.values)).toEqual({
      name: "Priya",
      tags: ["a"],
      email: true,
    });
  });

  it("saves a copy and takes it as the new baseline", async () => {
    const settings = create();
    settings.values.update((v) => ({ ...v, name: "Q" }));
    const handler = vi.fn();
    const outcome = await settings.save(handler);
    expect(outcome).toEqual({ ok: true });
    expect(handler).toHaveBeenCalledWith({
      name: "Q",
      tags: ["a"],
      email: true,
    });
    expect(get(settings.dirty)).toBe(false);
    expect(get(settings.status).state).toBe("saved");
  });

  it("keeps an edit made while the save runs dirty", async () => {
    const settings = create();
    settings.values.update((v) => ({ ...v, name: "Q" }));
    const done = settings.save(() => {
      settings.values.update((v) => ({ ...v, name: "QR" }));
    });
    await done;
    expect(get(settings.saved).name).toBe("Q");
    expect(get(settings.dirty)).toBe(true);
  });

  it("maps a resolved server error to its field and withdraws it on edit", async () => {
    const settings = create();
    settings.values.update((v) => ({ ...v, name: "taken" }));
    const outcome = await settings.save(() => ({
      errors: { name: "That name is taken." },
    }));
    expect(outcome.ok).toBe(false);
    expect(get(settings.errors)).toEqual({ name: "That name is taken." });
    expect(get(settings.dirty)).toBe(true);

    settings.values.update((v) => ({ ...v, name: "taken2" }));
    expect(get(settings.errors)).toEqual({});
  });

  it("fails the save when the handler throws", async () => {
    const settings = create();
    settings.values.update((v) => ({ ...v, name: "Q" }));
    const error = new Error("offline");
    const outcome = await settings.save(() => {
      throw error;
    });
    expect(outcome).toEqual({ ok: false, error });
    expect(get(settings.status)).toEqual({ state: "error", error });
    expect(get(settings.dirty)).toBe(true);
  });

  describe("optimistic", () => {
    it("reads clean while the save runs", async () => {
      const settings = create({ optimistic: true });
      settings.values.update((v) => ({ ...v, name: "Q" }));
      let dirtyDuringSave: boolean | undefined;
      await settings.save(() => {
        dirtyDuringSave = get(settings.dirty);
      });
      expect(dirtyDuringSave).toBe(false);
    });

    it("rolls back when the save fails", async () => {
      const settings = create({ optimistic: true });
      settings.values.update((v) => ({ ...v, name: "Q" }));
      await settings.save(() => {
        throw new Error("offline");
      });
      expect(get(settings.saved).name).toBe("Priya");
      expect(get(settings.values).name).toBe("Q");
      expect(get(settings.dirty)).toBe(true);
    });
  });

  it("ignores a second save while one runs", async () => {
    const settings = create();
    settings.values.update((v) => ({ ...v, name: "Q" }));
    const handler = vi.fn(() => new Promise<void>((r) => setTimeout(r, 5)));
    const [first, second] = await Promise.all([
      settings.save(handler),
      settings.save(handler),
    ]);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
  });
});
