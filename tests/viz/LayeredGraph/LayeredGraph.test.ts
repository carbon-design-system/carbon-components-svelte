import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import LayeredGraph from "./LayeredGraph.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock("../../../src/viz/utils/layout-layered.js", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../../src/viz/utils/layout-layered.js")
    >();
  return {
    ...actual,
    layoutLayered: (...args: Parameters<typeof actual.layoutLayered>) => {
      geometry.calls += 1;
      return actual.layoutLayered(...args);
    },
  };
});

const chart = () =>
  screen.getByRole("application", { name: "Service dependencies" });
const nodes = () =>
  Array.from(document.querySelectorAll<SVGGElement>(".bx--viz-graph__node"));
const labels = () =>
  nodes().map((node) =>
    node.querySelector(".bx--viz-graph__label")?.textContent?.trim(),
  );
const edges = () =>
  Array.from(document.querySelectorAll<SVGPathElement>(".bx--viz-graph__edge"));

beforeEach(() => {
  geometry.calls = 0;
});

describe("LayeredGraph", () => {
  it("draws a node per row in reading order and an edge per link, with arrows", () => {
    render(LayeredGraph);

    expect(labels()).toEqual(["app", "api", "web", "postgres", "auth"]);
    expect(edges()).toHaveLength(6);
    expect(edges()[0].getAttribute("marker-end")).toMatch(
      /^url\(#bx-viz-arrow-\d+\)$/,
    );
    expect(edges()[0].getAttribute("d")).toMatch(/^M[\d.]+,36L/);
  });

  it("marks the edge that would close a cycle and says so in the list", () => {
    render(LayeredGraph);

    const back = edges().filter((path) =>
      path.classList.contains("bx--viz-graph__edge--back"),
    );
    expect(back).toHaveLength(1);
    const items = within(screen.getByTestId("graph"))
      .getAllByRole("listitem", { hidden: true })
      .map((item) => item.textContent?.replace(/\s+/g, " ").trim());
    expect(items).toContain("Node: app, level 1, expanded");
    expect(items).toContain("Edge: auth to app, back");
    expect(items).toContain("Edge: api to postgres");
  });

  it("walks the nodes with the keyboard and folds one with Left, without laying out until it folds", async () => {
    const onhover = vi.fn();
    const ontoggle = vi.fn();
    render(LayeredGraph, { onhover, ontoggle });
    const built = geometry.calls;

    chart().focus();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "api", rank: 1 }),
    );
    expect(nodes()[1]).toHaveClass("bx--viz-graph__node--active");
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "api, level 2, expanded",
    );
    expect(
      edges().filter((path) =>
        path.classList.contains("bx--viz-graph__edge--active"),
      ),
    ).toHaveLength(3);
    expect(geometry.calls).toBe(built);

    await user.keyboard("{ArrowLeft}");
    expect(ontoggle).toHaveBeenCalledWith({ id: "api", collapsed: true });
    expect(screen.getByTestId("collapsed")).toHaveTextContent("api");
    expect(labels()).toEqual(["app", "api", "web", "auth"]);
    expect(
      nodes()[1].querySelector(".bx--viz-graph__badge-text"),
    ).toHaveTextContent("+1");
    expect(geometry.calls).toBeGreaterThan(built);

    await user.keyboard("{ArrowRight}");
    expect(screen.getByTestId("collapsed")).toHaveTextContent("");
  });

  it("selects on click and Enter, and folds on double click", async () => {
    const onselect = vi.fn();
    render(LayeredGraph, { onselect });

    await fireEvent.click(nodes()[3]);
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({
        node: expect.objectContaining({ id: "db", label: "postgres" }),
      }),
    );
    expect(screen.getByTestId("selected")).toHaveTextContent("db");
    expect(nodes()[3]).toHaveClass("bx--viz-graph__node--selected");

    await fireEvent.dblClick(nodes()[1]);
    expect(screen.getByTestId("collapsed")).toHaveTextContent("api");
  });

  it("draws lane bands in lane order and labels them", () => {
    render(LayeredGraph, { withLanes: true });

    const bands = Array.from(document.querySelectorAll(".bx--viz-graph__lane"));
    expect(bands).toHaveLength(3);
    expect(
      Array.from(document.querySelectorAll(".bx--viz-graph__lane-label")).map(
        (n) => n.textContent?.trim(),
      ),
    ).toEqual(["edge", "services", "data"]);
    expect(document.querySelector("[aria-live]")).not.toBeNull();
  });

  it("is grayscale without a group or status, and colors frames, edges, and lanes by group", async () => {
    const { rerender } = render(LayeredGraph, { withLanes: true });
    expect(nodes()[0]).not.toHaveClass("bx--viz-graph__node--grouped");
    expect(nodes()[0].style.getPropertyValue("--bx-viz-color")).toBe("");
    expect(
      screen.getByTestId("graph").querySelector(".bx--viz-treemap__legend"),
    ).toBeNull();

    await rerender({ withLanes: true, withGroups: true });
    const named = (label: string) =>
      nodes().find(
        (node) =>
          node.querySelector(".bx--viz-graph__label")?.textContent?.trim() ===
          label,
      ) as SVGGElement;
    const color = (label: string) =>
      named(label).style.getPropertyValue("--bx-viz-color");
    expect(named("app")).toHaveClass("bx--viz-graph__node--grouped");
    expect(color("app")).toBe(color("web"));
    expect(color("app")).not.toBe(color("api"));
    expect(edges()[0].style.getPropertyValue("--bx-viz-color")).toBe(
      color("app"),
    );
    const lanes = Array.from(
      document.querySelectorAll<SVGRectElement>(".bx--viz-graph__lane"),
    );
    expect(lanes[0]).toHaveClass("bx--viz-graph__lane--tinted");
    expect(lanes[0].style.getPropertyValue("--bx-viz-color")).toBe(
      color("app"),
    );
    expect(
      Array.from(
        screen
          .getByTestId("graph")
          .querySelectorAll(".bx--viz-treemap__legend-item"),
      ).map((n) => n.textContent?.trim()),
    ).toEqual(["edge", "services", "data"]);
  });

  it("frames a node by status with a glyph, says it in words, and ignores an unknown status", () => {
    render(LayeredGraph, { withStatus: true });

    expect(nodes()[0]).toHaveClass("bx--viz-graph__node--success");
    expect(nodes()[0].querySelector(".bx--viz-graph__status")).not.toBeNull();
    expect(nodes()[1]).toHaveClass("bx--viz-graph__node--warning");
    expect(nodes()[3]).toHaveClass("bx--viz-graph__node--error");
    expect(nodes()[2]).toHaveClass("bx--viz-graph__node--plain");
    expect(nodes()[4]).toHaveClass("bx--viz-graph__node--plain");
    expect(nodes()[4].querySelector(".bx--viz-graph__status")).toBeNull();
    const items = within(screen.getByTestId("graph"))
      .getAllByRole("listitem", { hidden: true })
      .map((item) => item.textContent?.replace(/\s+/g, " ").trim());
    expect(items).toContain("Node: postgres, error, level 3");
    expect(
      Array.from(
        screen
          .getByTestId("graph")
          .querySelectorAll(".bx--viz-treemap__legend-item"),
      ).map((n) => n.textContent?.trim()),
    ).toEqual(["success", "warning", "error"]);
  });

  it("routes with right angles and runs left to right when asked", () => {
    render(LayeredGraph, { rankDir: "LR", edge: "orthogonal" });

    expect(edges()[0].getAttribute("d")?.split("L")).toHaveLength(4);
    const [app, api] = nodes();
    const x = (node: SVGGElement) =>
      Number(node.getAttribute("transform")?.match(/translate\(([\d.]+)/)?.[1]);
    expect(x(api)).toBeGreaterThan(x(app));
  });
});
