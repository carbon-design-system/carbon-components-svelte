// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import Tips from "./InlineTip.ssr.test.svelte";

function regions(props: Record<string, unknown>) {
  const { document } = renderSSR(Tips, props);
  return [...document.querySelectorAll("[role=region]")].map((region) =>
    region.hasAttribute("aria-roledescription") ? "banner" : region.id,
  );
}

describe("InlineTip and Guidebanner server render", () => {
  it("prints no tip until the stored dismissals are known", () => {
    expect(regions({})).toEqual([]);
  });

  it("prints every tip when the page asks to show them while it waits", () => {
    expect(regions({ pending: "show" })).toEqual(["filters", "banner"]);
  });

  it("prints only the tips the server knows are still to show", () => {
    expect(regions({ initial: ["filters"] })).toEqual(["banner"]);
    expect(regions({ initial: ["export", "share"] })).toEqual(["filters"]);
    expect(regions({ initial: [] })).toEqual(["filters", "banner"]);
  });

  it("counts the tips of a banner in the server markup", () => {
    const { document } = renderSSR(Tips, { initial: [] });

    expect(
      document
        .querySelector("[role=group][aria-roledescription=slide]")
        ?.getAttribute("aria-label"),
    ).toBe("1 of 2");
  });

  it("does not read the storage on the server", () => {
    const onRead = vi.fn();

    renderSSR(Tips, { pending: "show", onRead });

    expect(onRead).not.toHaveBeenCalled();
  });
});
