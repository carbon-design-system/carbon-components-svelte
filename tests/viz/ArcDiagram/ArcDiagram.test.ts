import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import ArcDiagram from "./ArcDiagram.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock(
  "../../../src/viz/ArcDiagram/arc-geometry.js",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../src/viz/ArcDiagram/arc-geometry.js")
      >();
    return {
      ...actual,
      buildArcDiagram: (...args: Parameters<typeof actual.buildArcDiagram>) => {
        geometry.calls += 1;
        return actual.buildArcDiagram(...args);
      },
    };
  },
);

const chart = () => screen.getByRole("application", { name: "Module imports" });
const nodes = () =>
  Array.from(document.querySelectorAll<SVGGElement>(".bx--viz-arc__node"));
const links = () =>
  Array.from(document.querySelectorAll<SVGPathElement>(".bx--viz-arc__link"));
const items = () =>
  within(screen.getByTestId("arc"))
    .getAllByRole("listitem", { hidden: true })
    .map((item) => item.textContent?.replace(/\s+/g, " ").trim());

beforeEach(() => {
  geometry.calls = 0;
});

describe("ArcDiagram", () => {
  it("draws a node per row along a line, an arc per link with a stroke by value, and lists both", () => {
    render(ArcDiagram);

    expect(nodes()).toHaveLength(4);
    expect(
      nodes().map((n) =>
        n.querySelector(".bx--viz-arc__label")?.textContent?.trim(),
      ),
    ).toEqual(["app", "button", "config", "dialog"]);
    expect(links()).toHaveLength(3);
    expect(Number(links()[1].getAttribute("stroke-width"))).toBeGreaterThan(
      Number(links()[0].getAttribute("stroke-width")),
    );
    expect(
      links().every((l) =>
        /A[\d.]+,[\d.]+,0,0,1,/.test(l.getAttribute("d") ?? ""),
      ),
    ).toBe(true);
    expect(items()).toContain("Node: app, 3 links");
    expect(items()).toContain("Link: config to app: 3");
    expect(links()[2].querySelector("title")).toHaveTextContent(
      "config to app: 3",
    );
    expect(nodes()[0]).not.toHaveClass("bx--viz-arc__node--grouped");
    expect(
      screen.getByTestId("arc").querySelector(".bx--viz-treemap__legend"),
    ).toBeNull();
  });

  it("walks the nodes with the keyboard, lighting the links that touch them, without laying out again", async () => {
    const onhover = vi.fn();
    render(ArcDiagram, { onhover });
    const built = geometry.calls;

    chart().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "b", label: "button", degree: 1 }),
    );
    expect(nodes()[1]).toHaveClass("bx--viz-arc__node--active");
    expect(
      links().filter((l) => l.classList.contains("bx--viz-arc__link--active")),
    ).toHaveLength(1);
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "button, 1 links",
    );
    await user.keyboard("{Escape}");
    expect(onhover).toHaveBeenLastCalledWith(null);
    expect(geometry.calls).toBe(built);
  });

  it("selects on click and Enter with the node's links in the detail", async () => {
    const onselect = vi.fn();
    render(ArcDiagram, { onselect });

    await fireEvent.click(nodes()[0]);
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({
        node: expect.objectContaining({ id: "a", label: "app" }),
        links: [
          expect.objectContaining({ source: "a", target: "b" }),
          expect.objectContaining({ source: "a", target: "d" }),
          expect.objectContaining({ source: "c", target: "a" }),
        ],
      }),
    );
    expect(screen.getByTestId("selected")).toHaveTextContent("a");
    expect(nodes()[0]).toHaveClass("bx--viz-arc__node--selected");

    chart().focus();
    await user.keyboard("{End}{Enter}");
    expect(screen.getByTestId("selected")).toHaveTextContent("d");
  });

  it("colors by group with a legend, and arcs a backward link under the line when directed", () => {
    render(ArcDiagram, { withGroups: true, directed: true });

    expect(nodes()[0]).toHaveClass("bx--viz-arc__node--grouped");
    expect(nodes()[0].style.getPropertyValue("--bx-viz-color")).toBe(
      nodes()[2].style.getPropertyValue("--bx-viz-color"),
    );
    expect(links()[0].style.getPropertyValue("--bx-viz-color")).toBe(
      nodes()[0].style.getPropertyValue("--bx-viz-color"),
    );
    expect(
      Array.from(
        screen
          .getByTestId("arc")
          .querySelectorAll(".bx--viz-treemap__legend-item"),
      ).map((n) => n.textContent?.trim()),
    ).toEqual(["core", "ui"]);
    expect(links()[2].getAttribute("d")).toMatch(/,0,0,0,/);
  });
});
