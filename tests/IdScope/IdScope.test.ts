import { fireEvent, render, screen } from "@testing-library/svelte";
import Derived from "./Derived.test.svelte";
import IdScope from "./IdScope.test.svelte";

const probeIds = () =>
  screen.getAllByTestId("probe").map((probe) => probe.getAttribute("id"));

describe("useId and createIdScope", () => {
  it("falls back to a random id outside a scope", () => {
    render(IdScope, { props: { scoped: false } });
    const [a1, a2, b, unnamed, legacy] = probeIds();

    expect(a1).toMatch(/^ccs-[a-z0-9]+$/);
    expect(new Set([a1, a2, b, unnamed]).size).toBe(4);
    expect(legacy).toMatch(/^legacy-prefix-[a-z0-9]+$/);
  });

  it("counts per name in render order inside a scope", () => {
    render(IdScope, { props: { prefix: "app" } });

    expect(probeIds()).toEqual([
      "app-a-0",
      "app-a-1",
      "app-b-0",
      "app-0",
      "app-legacy-0",
    ]);
  });

  it("gives the same ids to a second render", () => {
    const first = render(IdScope, { props: { prefix: "app" } });
    const ids = probeIds();
    first.unmount();
    render(IdScope, { props: { prefix: "app" } });

    expect(probeIds()).toEqual(ids);
  });

  it("starts an inner scope that its descendants use", () => {
    render(IdScope, { props: { prefix: "app", nested: true } });

    expect(probeIds()).toEqual([
      "app-a-0",
      "app-a-1",
      "app-b-0",
      "app-0",
      "app-legacy-0",
      "inner-a-0",
      "inner-a-1",
      "inner-b-0",
      "inner-0",
      "inner-legacy-0",
    ]);
  });

  it("generates the prefix from the name when no id is given", () => {
    render(IdScope, { props: { name: "tabs", nested: true } });

    const [base] = screen.getAllByTestId("base");

    expect(base.textContent).toMatch(/^ccs-[a-z0-9]+$/);
    expect(probeIds()[0]).toBe(`${base.textContent}-a-0`);
  });

  it("returns a random id when called after init", async () => {
    render(IdScope, { props: { prefix: "app" } });
    await fireEvent.click(screen.getByText("late"));

    expect(screen.getByTestId("late").textContent).toMatch(/^ccs-[a-z0-9]+$/);
  });
});

describe("ids a component derives", () => {
  it("uses the fallback prefix for a generated scope prefix", () => {
    render(IdScope, { props: { name: "list", fallbackPrefix: "list-name" } });

    const [base] = screen.getAllByTestId("base");

    expect(base?.textContent).toMatch(/^list-name-[a-z0-9]+$/);
  });

  it("renames Tooltip's derived ids when its id changes", async () => {
    const { rerender } = render(Derived);

    expect(document.getElementById("tip-tooltip")).not.toBeNull();
    expect(document.getElementById("tip-trigger")).not.toBeNull();

    await rerender({ tooltipBase: "hint" });

    expect(document.getElementById("hint-tooltip")).not.toBeNull();
    expect(document.getElementById("hint-trigger")).not.toBeNull();
    expect(document.getElementById("tip-tooltip")).toBeNull();
  });

  it("spends a generated id only on a TabContent no tab claims", () => {
    render(Derived);

    const panels = [...document.querySelectorAll(".bx--tab-content")];
    const tabs = screen.getAllByRole("tab");

    expect(panels.map((panel) => panel.id)).toEqual([
      `${tabs[0]?.id}-panel`,
      `${tabs[1]?.id}-panel`,
      "app-tabs-0-tab-content-0",
    ]);
  });

  it("keeps DataTable's slotted ids apart from its header ids", () => {
    render(Derived);

    const search = screen.getByRole("searchbox");

    expect(search.id).toMatch(/^t-slot-/);
    expect(document.querySelectorAll("#t-search-0")).toHaveLength(1);
  });
});
