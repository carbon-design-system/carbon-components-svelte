// @vitest-environment node
import { get } from "svelte/store";
import {
  createIconLoader,
  resolveIcon,
} from "../../src/IconPicker/icon-loader.js";

function Icon() {}
function Other() {}

const item = (id: string, load?: () => Promise<unknown>) => ({
  id,
  label: id,
  load: load as never,
});

describe("createIconLoader", () => {
  it("imports each icon once, however often it is asked", async () => {
    const load = vi.fn(() => Promise.resolve({ default: Icon }));
    const loader = createIconLoader();
    await Promise.all([
      loader.load([item("A", load), item("B", load)]),
      loader.load([item("A", load)]),
    ]);
    await loader.load([item("A", load)]);
    expect(load).toHaveBeenCalledTimes(2);
    expect(get(loader.icons).get("A")).toBe(Icon);
  });

  it("updates the store once for a batch", async () => {
    const loader = createIconLoader();
    const seen: number[] = [];
    loader.icons.subscribe((icons) => seen.push(icons.size));
    await loader.load([
      item("A", () => Promise.resolve(Icon)),
      item("B", () => Promise.resolve(Icon)),
      item("C", () => Promise.resolve(Icon)),
    ]);
    expect(seen).toEqual([0, 3]);
  });

  it("does not ask for an icon that failed, and does not break the batch", async () => {
    const broken = vi.fn(() => Promise.reject(new Error("offline")));
    const loader = createIconLoader();
    await loader.load([
      item("A", broken),
      item("B", () => Promise.resolve(Icon)),
    ]);
    await loader.load([item("A", broken)]);
    expect(broken).toHaveBeenCalledTimes(1);
    expect([...get(loader.icons).keys()]).toEqual(["B"]);
  });

  it("takes the export named for the icon from a shared chunk", async () => {
    const chunk = vi.fn(() => Promise.resolve({ A: Icon, B: Other }));
    const loader = createIconLoader();
    await loader.load([item("A", chunk), item("B", chunk)]);
    expect(get(loader.icons).get("A")).toBe(Icon);
    expect(get(loader.icons).get("B")).toBe(Other);
  });

  it("skips an item that carries its icon", async () => {
    const load = vi.fn(() => Promise.resolve(Other));
    const loader = createIconLoader();
    await loader.load([{ ...item("A", load), icon: Icon as never }]);
    expect(load).not.toHaveBeenCalled();
  });

  it("waits for an icon that is already on its way", async () => {
    let resolve: (icon: unknown) => void = () => {};
    const slow = vi.fn(
      () => new Promise((done) => (resolve = done)) as Promise<unknown>,
    );
    const loader = createIconLoader();
    const first = loader.load([item("A", slow)]);
    let second = false;
    const waiting = loader.load([item("A", slow)]).then(() => {
      second = true;
    });
    await Promise.resolve();
    expect(second).toBe(false);
    resolve(Icon);
    await Promise.all([first, waiting]);
    expect(slow).toHaveBeenCalledTimes(1);
    expect(second).toBe(true);
    expect(get(loader.icons).get("A")).toBe(Icon);
  });

  it("drops results that arrive after destroy", async () => {
    const loader = createIconLoader();
    const loading = loader.load([item("A", () => Promise.resolve(Icon))]);
    loader.destroy();
    await loading;
    expect(get(loader.icons).size).toBe(0);
  });
});

describe("resolveIcon", () => {
  it("prefers the item's icon over the imported one, and is null while loading", () => {
    const imported = new Map([["A", Other as never]]);
    expect(
      resolveIcon({ id: "A", label: "A", icon: Icon as never }, imported),
    ).toBe(Icon);
    expect(resolveIcon({ id: "A", label: "A" }, imported)).toBe(Other);
    expect(resolveIcon({ id: "Z", label: "Z" }, imported)).toBeNull();
    expect(resolveIcon(undefined, imported)).toBeNull();
  });
});
