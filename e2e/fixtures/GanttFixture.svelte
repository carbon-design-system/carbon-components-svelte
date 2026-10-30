<script>
  import { Gantt } from "carbon-components-svelte";

  // `?zoom=day&size=short&n=2000&links=1500&readonly&cancel&long` pick a
  // variant.
  // `n` tasks are spread over 20 phases, which makes a stress chart.
  const params = new URLSearchParams(
    typeof location === "undefined" ? "" : location.search,
  );
  const size = params.get("size") ?? undefined;
  const count = Number(params.get("n") ?? 0);
  const linkCount = Number(params.get("links") ?? 0);

  function addDays(iso, days) {
    const date = new Date(`${iso}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  /** A seeded generator, so a stress run is the same every time. */
  function random(initial) {
    let seed = initial;
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function stress() {
    const next = random(7);
    const phases = 20;
    const perPhase = Math.ceil(count / phases);
    const ids = [];
    const phaseIds = [];
    const nodes = Array.from({ length: phases }, (_, p) => {
      phaseIds.push(`p${p}`);
      return {
        id: `p${p}`,
        text: `Phase ${p + 1}`,
        nodes: Array.from({ length: perPhase }, (_, i) => {
          const id = `t${p}-${i}`;
          ids.push(id);
          const start = addDays(
            "2026-03-02",
            p * 14 + Math.floor(next() * 120),
          );
          return {
            id,
            text: `Task ${p + 1}.${i + 1}`,
            start,
            end: addDays(start, 2 + Math.floor(next() * 12)),
            progress: Math.floor(next() * 100),
          };
        }),
      };
    });
    const links = [];
    for (let i = 0; i < linkCount; i++) {
      const from = ids[Math.floor(next() * ids.length)];
      const to =
        ids[
          Math.min(
            ids.indexOf(from) + 1 + Math.floor(next() * 4),
            ids.length - 1,
          )
        ];
      if (from !== to) links.push({ from, to });
    }
    return { nodes, links, phaseIds };
  }

  const project = [
    {
      id: "plan",
      text: "Planning",
      nodes: [
        {
          id: "brief",
          text: "Write the brief",
          start: "2026-03-02",
          end: "2026-03-06",
          progress: 100,
        },
        {
          id: "design",
          text: "Design review",
          start: "2026-03-09",
          end: "2026-03-13",
          progress: 60,
        },
        {
          id: "approved",
          text: "Plan approved",
          start: "2026-03-16",
          milestone: true,
        },
      ],
    },
    {
      id: "build",
      text: "Build",
      nodes: [
        {
          id: "api",
          text: "API",
          start: "2026-03-17",
          end: "2026-03-27",
          progress: 30,
        },
        {
          id: "ui",
          text: "Interface",
          start: "2026-03-20",
          end: "2026-04-03",
          progress: 10,
        },
        {
          id: "locked",
          text: "Migration (locked)",
          start: "2026-03-30",
          end: "2026-04-06",
          readonly: true,
        },
      ],
    },
    { id: "ship", text: "Launch", start: "2026-04-08", milestone: true },
    { id: "later", text: "Retrospective" },
  ];

  const projectLinks = [
    { from: "brief", to: "design" },
    { from: "design", to: "approved" },
    { from: "approved", to: "api" },
    { from: "approved", to: "ui" },
    { from: "api", to: "locked" },
    { from: "ui", to: "ship" },
    { from: "locked", to: "ship" },
    { from: "ui", to: "locked" },
  ];

  if (params.has("long")) {
    project[0].nodes[0].text =
      "Write the brief for the internationalization and accessibility overhaul";
  }

  const big = count > 0 ? stress() : null;
  let tasks = big ? big.nodes : project;
  const links = big ? big.links : projectLinks;
  let expandedIds = big ? big.phaseIds : ["plan", "build"];
  let selectedIds = [];
  let activeId = "";
  let zoom = params.get("zoom") ?? "week";
  let last = "";

  if (typeof window !== "undefined") {
    // Lets a stress run change the zoom without a control.
    window.__setZoom = (next) => {
      zoom = next;
    };
  }

  function handleChange(event) {
    last = JSON.stringify({
      id: event.detail.id,
      start: event.detail.start,
      end: event.detail.end,
      mode: event.detail.mode,
      source: event.detail.source,
    });
    if (params.has("cancel")) event.preventDefault();
  }
</script>

<Gantt
  labelText="Launch plan"
  {size}
  {links}
  today="2026-03-11"
  height={params.has("tall") ? 900 : 360}
  readonly={params.has("readonly")}
  bind:tasks
  bind:zoom
  bind:expandedIds
  bind:selectedIds
  bind:activeId
  on:change={handleChange}
/>

<button type="button">After the chart</button>
<output data-testid="change">{last}</output>
<output data-testid="selected">{selectedIds.join(",")}</output>
