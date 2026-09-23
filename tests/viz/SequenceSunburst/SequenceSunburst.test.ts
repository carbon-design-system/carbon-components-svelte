import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import SequenceSunburst from "./SequenceSunburst.test.svelte";

const chart = () => screen.getByRole("application", { name: "Checkout paths" });
const arcs = () =>
  Array.from(
    document.querySelectorAll<SVGPathElement>(".bx--viz-sunburst__arc"),
  );
const trail = () =>
  screen.getByTestId("seq").querySelector(".bx--viz-sequence-sunburst__trail");
const table = () =>
  within(screen.getByTestId("seq"))
    .getAllByRole("row", { hidden: true })
    .map((row) =>
      Array.from(row.querySelectorAll("th, td")).map((c) =>
        c.textContent?.trim(),
      ),
    );

describe("SequenceSunburst", () => {
  it("draws a ring per step with the same color for the same step name, and lists the prefixes", () => {
    render(SequenceSunburst);

    // home, search, pdp, cart, pdp, cart: six prefixes beyond the center.
    expect(arcs()).toHaveLength(6);
    const rows = table();
    expect(rows[1]).toEqual(["home", "1", "100", "100%"]);
    expect(rows[2]).toEqual(["search", "2", "80", "80%"]);
    expect(rows[3]).toEqual(["pdp", "3", "65", "65%"]);
    // "pdp" under search and "pdp" under home share a color.
    const color = (i: number) =>
      arcs()[i].style.getPropertyValue("--bx-viz-color");
    expect(color(2)).toBe(color(4));
    expect(color(1)).not.toBe(color(2));
    expect(
      Array.from(
        screen
          .getByTestId("seq")
          .querySelectorAll(".bx--viz-treemap__legend-item"),
      ).map((n) => n.textContent?.trim()),
    ).toEqual(["home", "search", "pdp", "cart"]);
    expect(trail()).toHaveTextContent("100 sequences");
    expect(
      screen
        .getByTestId("seq")
        .querySelector(".bx--viz-sunburst__center-label"),
    ).toHaveTextContent("Sessions");
  });

  it("writes the path to the hovered step with its share, colored like its arc, and reports what stopped there", async () => {
    const onhover = vi.fn();
    render(SequenceSunburst, { onhover });

    chart().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    expect(onhover).toHaveBeenLastCalledWith({
      path: ["home", "search", "pdp"],
      step: "pdp",
      depth: 3,
      value: 65,
      share: 0.65,
      stopped: 25,
      rows: [
        expect.objectContaining({ users: 40 }),
        expect.objectContaining({ users: 25 }),
      ],
    });
    const steps = Array.from(
      trail()?.querySelectorAll(".bx--viz-sequence-sunburst__step") ?? [],
    );
    expect(steps.map((s) => s.textContent?.trim())).toEqual([
      "home",
      "search",
      "pdp",
    ]);
    expect(steps[2]).toHaveClass("bx--viz-sequence-sunburst__step--current");
    expect(
      (steps[2] as HTMLElement).style.getPropertyValue("--bx-viz-color"),
    ).toBe(arcs()[2].style.getPropertyValue("--bx-viz-color"));
    expect(trail()).toHaveTextContent("65% of 100 sequences");

    await user.keyboard("{Escape}");
    expect(onhover).toHaveBeenLastCalledWith(null);
    expect(trail()).toHaveTextContent("100 sequences");
  });

  it("selects on Enter with the path in the detail, and can hide the trail", async () => {
    const onselect = vi.fn();
    const { rerender } = render(SequenceSunburst, { onselect });

    chart().focus();
    await user.keyboard("{ArrowRight}{Enter}");
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({ path: ["home"], value: 100, stopped: 0 }),
    );

    await rerender({ onselect, trail: false });
    expect(trail()).toBeNull();
  });
});
