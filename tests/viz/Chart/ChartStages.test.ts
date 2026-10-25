import { render } from "@testing-library/svelte";
import BarChart from "./ChartStages.test.svelte";

const stages = vi.hoisted(() => ({ group: 0, decorate: 0 }));

vi.mock("../../../src/viz/Chart/model.js", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../../src/viz/Chart/model.js")>();
  return {
    ...actual,
    groupRows: (...args: Parameters<typeof actual.groupRows>) => {
      stages.group += 1;
      return actual.groupRows(...args);
    },
    decorateGroups: (...args: Parameters<typeof actual.decorateGroups>) => {
      stages.decorate += 1;
      return actual.decorateGroups(...args);
    },
  };
});

const rows = (from = 0) =>
  ["Q1", "Q2", "Q3", "Q4"].flatMap((quarter, i) =>
    ["a", "b", "c"].map((region, r) => ({
      quarter,
      region,
      revenue: from + 10 + i * 3 + r * 7,
    })),
  );

beforeEach(() => {
  stages.group = 0;
  stages.decorate = 0;
});

describe("Chart stages", () => {
  it("reads the rows once on mount, for a stacked chart with titled axes and a legend", () => {
    render(BarChart, {
      data: rows(),
      mode: "stacked",
      xTitle: "Quarter",
      yTitle: "Revenue",
    });

    expect(stages.group).toBe(1);
  });

  it("never comes back to the rows for a zoom, a legend toggle, or a color change", async () => {
    const { rerender } = render(BarChart, { data: rows() });
    const read = stages.group;

    await rerender({ zoom: [1, 2] });
    await rerender({ hidden: ["b"] });
    await rerender({ colors: { a: "purple" } });
    expect(stages.group).toBe(read);
    expect(stages.decorate).toBeGreaterThan(0);

    await rerender({ data: rows(5) });
    expect(stages.group).toBe(read + 1);
  });
});
