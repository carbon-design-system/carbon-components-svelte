import { render, screen } from "@testing-library/svelte";
import type { ComponentType, SvelteComponent } from "svelte";

type AnyChart = ComponentType<SvelteComponent<Record<string, unknown>>>;

import AlluvialChart from "../../src/viz/AlluvialChart/AlluvialChart.svelte";
import ArcDiagram from "../../src/viz/ArcDiagram/ArcDiagram.svelte";
import BumpChart from "../../src/viz/BumpChart/BumpChart.svelte";
import CalendarHeatmap from "../../src/viz/CalendarHeatmap/CalendarHeatmap.svelte";
import ChordDiagram from "../../src/viz/ChordDiagram/ChordDiagram.svelte";
import ChoroplethChart from "../../src/viz/ChoroplethChart/ChoroplethChart.svelte";
import CirclePackChart from "../../src/viz/CirclePackChart/CirclePackChart.svelte";
import CohortTable from "../../src/viz/CohortTable/CohortTable.svelte";
import DonutChart from "../../src/viz/DonutChart/DonutChart.svelte";
import EventTimeline from "../../src/viz/EventTimeline/EventTimeline.svelte";
import FlameGraph from "../../src/viz/FlameGraph/FlameGraph.svelte";
import ForestPlot from "../../src/viz/ForestPlot/ForestPlot.svelte";
import GanttChart from "../../src/viz/GanttChart/GanttChart.svelte";
import GraphCanvas from "../../src/viz/GraphCanvas/GraphCanvas.svelte";
import Heatmap from "../../src/viz/Heatmap/Heatmap.svelte";
import HivePlot from "../../src/viz/HivePlot/HivePlot.svelte";
import HorizonChart from "../../src/viz/HorizonChart/HorizonChart.svelte";
import IcicleChart from "../../src/viz/IcicleChart/IcicleChart.svelte";
import LayeredGraph from "../../src/viz/LayeredGraph/LayeredGraph.svelte";
import MarimekkoChart from "../../src/viz/MarimekkoChart/MarimekkoChart.svelte";
import OrgChart from "../../src/viz/OrgChart/OrgChart.svelte";
import ParallelCoordinates from "../../src/viz/ParallelCoordinates/ParallelCoordinates.svelte";
import RadarChart from "../../src/viz/RadarChart/RadarChart.svelte";
import RidgelineChart from "../../src/viz/RidgelineChart/RidgelineChart.svelte";
import SequenceDiagram from "../../src/viz/SequenceDiagram/SequenceDiagram.svelte";
import SequenceSunburst from "../../src/viz/SequenceSunburst/SequenceSunburst.svelte";
import SlopeChart from "../../src/viz/SlopeChart/SlopeChart.svelte";
import SpanWaterfall from "../../src/viz/SpanWaterfall/SpanWaterfall.svelte";
import StateTimeline from "../../src/viz/StateTimeline/StateTimeline.svelte";
import SunburstChart from "../../src/viz/SunburstChart/SunburstChart.svelte";
import TileGridMap from "../../src/viz/TileGridMap/TileGridMap.svelte";
import TreeChart from "../../src/viz/TreeChart/TreeChart.svelte";
import TreemapChart from "../../src/viz/TreemapChart/TreemapChart.svelte";
import UpSetPlot from "../../src/viz/UpSetPlot/UpSetPlot.svelte";
import WordCloudChart from "../../src/viz/WordCloudChart/WordCloudChart.svelte";

// Every chart that is not built on Chart: a skeleton while loading, the
// empty text with no rows, and nothing else of the body in either state.
const cases: Array<[string, unknown, Record<string, unknown>]> = [
  [
    "DonutChart",
    DonutChart,
    { data: [], value: "sessions", category: "device" },
  ],
  [
    "Heatmap",
    Heatmap,
    { data: [], x: "day", y: "block", value: "requests", rowHeader: "Time" },
  ],
  [
    "CalendarHeatmap",
    CalendarHeatmap,
    { data: [], date: "day", value: "commits" },
  ],
  ["CohortTable", CohortTable, { rows: [], sizeHeader: "Users" }],
  ["TileGridMap", TileGridMap, { data: [], region: "state", value: "signups" }],
  [
    "ChoroplethChart",
    ChoroplethChart,
    { data: [], region: "region", value: "customers" },
  ],
  ["TreemapChart", TreemapChart, { data: [], value: "cost", label: "service" }],
  [
    "CirclePackChart",
    CirclePackChart,
    { data: [], value: "commits", label: "repo" },
  ],
  [
    "SunburstChart",
    SunburstChart,
    { data: [], id: "id", parent: "parent", value: "bytes", label: "name" },
  ],
  [
    "IcicleChart",
    IcicleChart,
    { data: [], id: "id", parent: "parent", value: "bytes", label: "name" },
  ],
  [
    "WordCloudChart",
    WordCloudChart,
    { data: [], word: "term", value: "mentions" },
  ],
  [
    "GanttChart",
    GanttChart,
    { data: [], label: "name", group: "stream", start: "from", end: "to" },
  ],
  [
    "StateTimeline",
    StateTimeline,
    { data: [], row: "service", state: "status", start: "from", end: "to" },
  ],
  [
    "EventTimeline",
    EventTimeline,
    { data: [], at: "at", kind: "type", label: "name" },
  ],
  [
    "SequenceDiagram",
    SequenceDiagram,
    { data: [], from: "from", to: "to", label: "msg", kind: "kind" },
  ],
  [
    "SpanWaterfall",
    SpanWaterfall,
    {
      data: [],
      id: "id",
      parent: "parent",
      start: "start",
      duration: "ms",
      label: "name",
      group: "service",
    },
  ],
  [
    "RadarChart",
    RadarChart,
    { data: [], axis: "category", value: "score", series: "page" },
  ],
  [
    "ParallelCoordinates",
    ParallelCoordinates,
    { data: [], series: "tier", label: "name" },
  ],
  [
    "AlluvialChart",
    AlluvialChart,
    { data: [], source: "from", target: "to", value: "users" },
  ],
  [
    "ChordDiagram",
    ChordDiagram,
    { data: [], source: "from", target: "to", value: "n" },
  ],
  [
    "ArcDiagram",
    ArcDiagram,
    { nodes: [], id: "id", source: "from", target: "to" },
  ],
  [
    "HivePlot",
    HivePlot,
    { nodes: [], id: "id", axis: "kind", source: "from", target: "to" },
  ],
  [
    "TreeChart",
    TreeChart,
    { data: [], id: "id", parent: "parent", label: "name" },
  ],
  [
    "OrgChart",
    OrgChart,
    { data: [], id: "id", parent: "manager", label: "name", sublabel: "title" },
  ],
  ["LayeredGraph", LayeredGraph, { nodes: [], id: "id", label: "name" }],
  [
    "MarimekkoChart",
    MarimekkoChart,
    { data: [], x: "channel", y: "sessions", series: "device" },
  ],
  [
    "SlopeChart",
    SlopeChart,
    { data: [], x: "survey", y: "score", series: "team" },
  ],
  [
    "BumpChart",
    BumpChart,
    { data: [], x: "week", rank: "rank", series: "team" },
  ],
  [
    "ForestPlot",
    ForestPlot,
    { data: [], label: "study", estimate: "or", lo: "lo", hi: "hi" },
  ],
  [
    "RidgelineChart",
    RidgelineChart,
    { data: [], x: "temp", series: "month", xTitle: "\u00b0C" },
  ],
  [
    "HorizonChart",
    HorizonChart,
    { data: [], x: "t", y: "cpu", series: "host" },
  ],
  ["UpSetPlot", UpSetPlot, { data: [], membership: "tags" }],
  [
    "SequenceSunburst",
    SequenceSunburst,
    { data: [], steps: "path", value: "users", rootLabel: "Sessions" },
  ],
  ["GraphCanvas", GraphCanvas, { nodes: [], id: "id", label: "name" }],
  [
    "FlameGraph",
    FlameGraph,
    { data: [], id: "id", parent: "parent", value: "ms", label: "fn" },
  ],
];

describe.each(cases)("%s states", (_, component, props) => {
  it("shows a skeleton while loading and the empty text without rows", () => {
    // The props form: a prop named `target` would otherwise read as the mount target.
    const { unmount } = render(component as AnyChart, {
      props: { ...props, title: "Chart", loading: true },
    });
    // The first figure: SequenceSunburst wraps a SunburstChart in its own.
    const figure = () => screen.getAllByRole("figure", { hidden: true })[0];
    expect(figure()).toHaveAttribute("aria-busy", "true");
    expect(figure().querySelector(".bx--viz-chart__skeleton")).not.toBeNull();
    expect(figure().querySelector(".bx--viz-chart__empty")).toBeNull();
    expectTitleAndOrder(figure());
    unmount();

    render(component as AnyChart, {
      props: { ...props, title: "Chart", emptyText: "Nothing yet" },
    });
    expect(figure()).not.toHaveAttribute("aria-busy");
    expect(figure().querySelector(".bx--viz-chart__empty")).toHaveTextContent(
      "Nothing yet",
    );
    expect(figure().querySelector(".bx--viz-chart__skeleton")).toBeNull();
    expectTitleAndOrder(figure());
  });
});

// The body is hidden while there is no data, so the title must sit outside
// it, and the state box takes the body's place, before the legend.
function expectTitleAndOrder(figure: HTMLElement) {
  const title = figure.querySelector(
    ":scope > .bx--viz-chart__title, :scope > figcaption, :scope > .bx--viz-chart__header .bx--viz-chart__title",
  );
  expect(title ?? figure.getAttribute("aria-label")).toBeTruthy();
  const state = figure.querySelector(".bx--viz-chart__state");
  const legend = figure.querySelector(
    ".bx--viz-legend, .bx--viz-treemap__legend",
  );
  if (state && legend) {
    expect(
      state.compareDocumentPosition(legend) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  }
}
