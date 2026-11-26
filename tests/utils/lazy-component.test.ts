import { get } from "svelte/store";
import { lazyComponent } from "../../src/utils/lazy-component.js";

describe("lazyComponent", () => {
  it("loads once and holds the component", async () => {
    const component = () => {};
    const loader = vi.fn(() => Promise.resolve({ default: component }));
    const lazy = lazyComponent(loader);

    expect(get(lazy)).toBeNull();
    lazy.load();
    lazy.load();
    await vi.waitFor(() => expect(get(lazy)).toBe(component));
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("tries again after a failed load", async () => {
    const component = () => {};
    const loader = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ default: component });
    const lazy = lazyComponent(loader);

    lazy.load();
    await vi.waitFor(() => expect(loader).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    expect(get(lazy)).toBeNull();

    lazy.load();
    await vi.waitFor(() => expect(get(lazy)).toBe(component));
  });
});
