import { render, screen } from "@testing-library/svelte";
import ArcDiagram from "../../src/viz/ArcDiagram/ArcDiagram.svelte";
import CirclePackChart from "../../src/viz/CirclePackChart/CirclePackChart.svelte";
import GanttChart from "../../src/viz/GanttChart/GanttChart.svelte";
import IcicleChart from "../../src/viz/IcicleChart/IcicleChart.svelte";
import LayeredGraph from "../../src/viz/LayeredGraph/LayeredGraph.svelte";
import MarimekkoChart from "../../src/viz/MarimekkoChart/MarimekkoChart.svelte";
import OrgChart from "../../src/viz/OrgChart/OrgChart.svelte";
import SpanWaterfall from "../../src/viz/SpanWaterfall/SpanWaterfall.svelte";
import SunburstChart from "../../src/viz/SunburstChart/SunburstChart.svelte";
import TreemapChart from "../../src/viz/TreemapChart/TreemapChart.svelte";
import WordCloudChart from "../../src/viz/WordCloudChart/WordCloudChart.svelte";
import { user } from "../utils/user";
import GroupLegend from "./GroupLegend.test.svelte";

const flat = [
  { id: "a", name: "A", value: 40, group: "x" },
  { id: "b", name: "B", value: 30, group: "y" },
  { id: "c", name: "C", value: 20, group: "z" },
];
const tree = [
  { id: "root", parent: null, name: "Root", value: 0, group: "x" },
  { id: "a", parent: "root", name: "A", value: 40, group: "x" },
  { id: "b", parent: "root", name: "B", value: 30, group: "y" },
  { id: "c", parent: "root", name: "C", value: 20, group: "z" },
];
const links = [
  { source: "a", target: "b" },
  { source: "b", target: "c" },
];

const cases: Array<[string, unknown, Record<string, unknown>]> = [
  [
    "TreemapChart",
    TreemapChart,
    { data: flat, value: "value", label: "name", group: "group" },
  ],
  [
    "CirclePackChart",
    CirclePackChart,
    { data: flat, value: "value", label: "name", group: "group" },
  ],
  [
    "WordCloudChart",
    WordCloudChart,
    { data: flat, word: "name", value: "value", group: "group" },
  ],
  [
    "GanttChart",
    GanttChart,
    {
      data: flat.map((row, i) => ({
        ...row,
        from: new Date(2026, 0, 1 + i),
        to: new Date(2026, 0, 3 + i),
      })),
      id: "id",
      label: "name",
      group: "group",
      start: "from",
      end: "to",
    },
  ],
  [
    "MarimekkoChart",
    MarimekkoChart,
    {
      data: flat.map((row) => ({ ...row, x: "Q1" })),
      x: "x",
      y: "value",
      series: "group",
    },
  ],
  [
    "ArcDiagram",
    ArcDiagram,
    { nodes: flat, links, id: "id", label: "name", group: "group" },
  ],
  [
    "LayeredGraph",
    LayeredGraph,
    { nodes: flat, links, id: "id", label: "name", group: "group" },
  ],
  [
    "SunburstChart",
    SunburstChart,
    {
      data: tree,
      id: "id",
      parent: "parent",
      value: "value",
      label: "name",
      group: "group",
    },
  ],
  [
    "IcicleChart",
    IcicleChart,
    {
      data: tree,
      id: "id",
      parent: "parent",
      value: "value",
      label: "name",
      group: "group",
    },
  ],
  [
    "OrgChart",
    OrgChart,
    { data: tree, id: "id", parent: "parent", label: "name", group: "group" },
  ],
  [
    "SpanWaterfall",
    SpanWaterfall,
    {
      data: tree.map((row, i) => ({ ...row, start: i * 10, duration: 10 })),
      id: "id",
      parent: "parent",
      label: "name",
      group: "group",
      start: "start",
      duration: "duration",
    },
  ],
];

describe.each(cases)("%s legend", (_, component, props) => {
  it("lists every group as a toggle, hides one, binds hidden, and keeps the last visible", async () => {
    const ontoggle = vi.fn();
    render(GroupLegend, {
      component: component as never,
      chartProps: props,
      ontoggle,
    });
    const buttons = () => screen.getAllByRole("button", { pressed: true });
    expect(buttons().map((b) => b.textContent?.trim())).toEqual([
      "x",
      "y",
      "z",
    ]);

    await user.click(buttons()[1]);
    expect(ontoggle).toHaveBeenLastCalledWith({ series: "y", hidden: true });
    expect(screen.getByTestId("hidden")).toHaveTextContent("y");
    expect(
      screen.getByRole("button", { name: "y", pressed: false }),
    ).toHaveClass("bx--viz-legend__item--hidden");
    expect(buttons()).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "x", pressed: true }));
    expect(buttons().map((b) => b.textContent?.trim())).toEqual(["z"]);
    await user.click(screen.getByRole("button", { name: "z", pressed: true }));
    expect(buttons().map((b) => b.textContent?.trim())).toEqual(["z"]);
    expect(ontoggle).toHaveBeenCalledTimes(2);

    await user.click(screen.getByRole("button", { name: "y", pressed: false }));
    expect(ontoggle).toHaveBeenLastCalledWith({ series: "y", hidden: false });
    expect(screen.getByTestId("hidden")).toHaveTextContent("x");
  });
});
