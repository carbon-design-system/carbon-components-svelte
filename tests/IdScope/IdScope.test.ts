import { fireEvent, render, screen } from "@testing-library/svelte";
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
