import { buildGantt } from "../../../src/viz/GanttChart/gantt-geometry.js";

type Task = {
  id: string;
  name: string;
  stream: string;
  from: Date;
  to: Date;
  done?: number;
  after?: string | string[];
};

const day = (d: number) => new Date(2026, 8, d);
const plan: Task[] = [
  {
    id: "spec",
    name: "spec",
    stream: "Design",
    from: day(1),
    to: day(8),
    done: 1,
  },
  {
    id: "api",
    name: "checkout API",
    stream: "API",
    from: day(4),
    to: day(16),
    done: 0.6,
    after: "spec",
  },
  {
    id: "auth",
    name: "auth",
    stream: "API",
    from: day(6),
    to: day(12),
    done: 0.3,
  },
  {
    id: "web",
    name: "storefront",
    stream: "Web",
    from: day(10),
    to: day(22),
    after: ["api", "auth"],
  },
  {
    id: "qa",
    name: "hardening",
    stream: "QA",
    from: day(20),
    to: day(25),
    after: "web",
  },
];
const options = {
  id: (row: Task) => row.id,
  label: (row: Task) => row.name,
  group: (row: Task) => row.stream,
  start: (row: Task) => row.from,
  end: (row: Task) => row.to,
  progress: (row: Task) => row.done,
  dependsOn: (row: Task) => row.after,
  plot: { x0: 100, x1: 580 },
  rowHeight: 24,
  locale: "en-US",
};

describe("buildGantt", () => {
  test("places a bar per task, one row each, grouped by workstream", () => {
    const gantt = buildGantt(plan, options);
    expect(gantt.tasks.map((task) => [task.label, task.line])).toEqual([
      ["spec", 0],
      ["checkout API", 1],
      ["auth", 2],
      ["storefront", 3],
      ["hardening", 4],
    ]);
    expect(
      gantt.groups.map((entry) => [entry.key, entry.y, entry.count]),
    ).toEqual([
      ["Design", 0, 1],
      ["API", 24, 2],
      ["Web", 72, 1],
      ["QA", 96, 1],
    ]);
    expect(gantt.domain).toEqual([day(1).getTime(), day(25).getTime()]);
    expect(gantt.tasks[0].x0).toBe(100);
    expect(gantt.tasks[4].x1).toBe(580);
    expect(gantt.tasks[1].progress).toBe(0.6);
    expect(gantt.tasks[3].progress).toBeNull();
    expect(gantt.height).toBe(120);
    expect(gantt.tasks[1].color).toBe(gantt.tasks[2].color);
    expect(gantt.tasks[0].color).not.toBe(gantt.tasks[1].color);
  });

  test("draws an arrow from the end of each dependency to the task's start, and flags a late one", () => {
    const gantt = buildGantt(plan, options);
    expect(gantt.links.map((link) => link.id)).toEqual([
      "spec->api",
      "api->web",
      "auth->web",
      "web->qa",
    ]);
    // Storefront ends on day 22 and hardening starts on day 20: the arrow
    // has to go back, so it steps around.
    const [first, , , last] = gantt.links;
    expect(last.d).toMatch(/^M[\d.]+,84H[\d.]+V[\d.]+H[\d.]+V108H[\d.]+$/);
    expect(last.late).toBe(true);
    // The API starts on day 4, before the spec ends on day 8.
    expect(first.late).toBe(true);
    const gap = buildGantt(
      [
        { id: "a", name: "a", stream: "s", from: day(1), to: day(3) },
        {
          id: "b",
          name: "b",
          stream: "s",
          from: day(5),
          to: day(8),
          after: "a",
        },
      ],
      options,
    );
    expect(gap.links[0].d).toMatch(/^M[\d.]+,12H[\d.]+V36H[\d.]+$/);
    expect(gap.links[0].late).toBe(false);
  });

  test("labels the axis with days and clips to a fixed domain", () => {
    const gantt = buildGantt(plan, { ...options, domain: [day(5), day(15)] });
    expect(gantt.ticks.length).toBeGreaterThan(1);
    expect(gantt.ticks[0].label).toMatch(/Sep/);
    expect(gantt.tasks[0].x0).toBe(100);
    expect(gantt.tasks[1].x1).toBe(580);
    expect(gantt.xLabel(day(5).getTime())).toBe("Sep 5, 2026");
  });

  test("drops a task with no usable dates and a dependency it cannot find", () => {
    const gantt = buildGantt(
      [
        ...plan,
        {
          id: "bad",
          name: "?",
          stream: "QA",
          from: new Date("nope"),
          to: day(2),
          after: "spec",
        },
        {
          id: "x",
          name: "x",
          stream: "QA",
          from: day(1),
          to: day(2),
          after: "ghost",
        },
      ],
      options,
    );
    expect(gantt.tasks.some((task) => task.id === "bad")).toBe(false);
    expect(gantt.links.some((link) => link.to === "x")).toBe(false);
  });
});
