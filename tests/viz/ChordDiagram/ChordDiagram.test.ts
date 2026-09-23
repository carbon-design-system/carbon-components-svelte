import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import ChordDiagram from "./ChordDiagram.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock(
  "../../../src/viz/ChordDiagram/chord-geometry.js",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../src/viz/ChordDiagram/chord-geometry.js")
      >();
    return {
      ...actual,
      buildChord: (...args: Parameters<typeof actual.buildChord>) => {
        geometry.calls += 1;
        return actual.buildChord(...args);
      },
    };
  },
);

const chart = () =>
  screen.getByRole("application", { name: "Cross-team handoffs" });
const groups = () =>
  Array.from(document.querySelectorAll<SVGGElement>(".bx--viz-chord__group"));
const ribbons = () =>
  Array.from(
    document.querySelectorAll<SVGPathElement>(".bx--viz-chord__ribbon"),
  );
const table = () =>
  Array.from(screen.getByTestId("chord").querySelectorAll("tr")).map((row) =>
    Array.from(row.querySelectorAll("th, td")).map((cell) =>
      cell.textContent?.replace(/\s+/g, " ").trim(),
    ),
  );

beforeEach(() => {
  geometry.calls = 0;
});

describe("ChordDiagram", () => {
  it("draws a group per node with its label, a ribbon per pair, and a matrix table", () => {
    render(ChordDiagram);

    expect(groups()).toHaveLength(4);
    expect(
      groups().map((g) =>
        g.querySelector(".bx--viz-chord__label")?.textContent?.trim(),
      ),
    ).toEqual(["Eng", "Design", "Sales", "Support"]);
    expect(ribbons()).toHaveLength(4);
    expect(ribbons()[0].style.getPropertyValue("--bx-viz-color")).toBe(
      groups()[0].style.getPropertyValue("--bx-viz-color"),
    );
    expect(table()).toEqual([
      ["From \\ to", "Eng", "Design", "Sales", "Support"],
      ["Eng", "", "12", "4", ""],
      ["Design", "8", "", "", ""],
      ["Sales", "", "", "", "3"],
      ["Support", "2", "", "", ""],
    ]);
  });

  it("walks the groups with the keyboard, lighting their ribbons and announcing in and out, without laying out again", async () => {
    const onhover = vi.fn();
    render(ChordDiagram, { onhover });
    const built = geometry.calls;

    chart().focus();
    await user.keyboard("{ArrowRight}");
    expect(onhover).toHaveBeenLastCalledWith({
      kind: "group",
      key: "Eng",
      out: 16,
      in: 10,
      total: 16,
    });
    expect(groups()[0]).toHaveClass("bx--viz-chord__group--active");
    expect(
      ribbons().filter((r) =>
        r.classList.contains("bx--viz-chord__ribbon--active"),
      ),
    ).toHaveLength(3);
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "Eng: 16 out, 10 in",
    );
    expect(document.querySelector(".bx--viz-chart-tooltip")).toHaveTextContent(
      "16 out, 10 in",
    );
    await user.keyboard("{End}");
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "Support: 2 out, 3 in",
    );
    await user.keyboard("{Escape}");
    expect(onhover).toHaveBeenLastCalledWith(null);
    expect(geometry.calls).toBe(built);
  });

  it("shows both directions of a ribbon on hover", async () => {
    const onhover = vi.fn();
    render(ChordDiagram, { onhover });

    await fireEvent.mouseEnter(ribbons()[0]);
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({
        kind: "ribbon",
        source: "Eng",
        target: "Design",
        forward: 12,
        backward: 8,
      }),
    );
    expect(
      document
        .querySelector(".bx--viz-chart-tooltip")
        ?.textContent?.replace(/\s+/g, " ")
        .trim(),
    ).toBe("Eng → Design 12 Design → Eng 8");
    expect(groups()[0]).toHaveClass("bx--viz-chord__group--active");
    expect(groups()[1]).toHaveClass("bx--viz-chord__group--active");
    expect(groups()[2]).not.toHaveClass("bx--viz-chord__group--active");
  });

  it("selects a group on click and Enter, with its ribbons in the detail", async () => {
    const onselect = vi.fn();
    render(ChordDiagram, { onselect });

    await fireEvent.click(groups()[1]);
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "Design",
        ribbons: [expect.objectContaining({ source: "Eng", target: "Design" })],
      }),
    );
    expect(screen.getByTestId("selected")).toHaveTextContent("Design");
    expect(groups()[1]).toHaveClass("bx--viz-chord__group--selected");

    chart().focus();
    await user.keyboard("{Home}{Enter}");
    expect(screen.getByTestId("selected")).toHaveTextContent("Eng");
  });
});
