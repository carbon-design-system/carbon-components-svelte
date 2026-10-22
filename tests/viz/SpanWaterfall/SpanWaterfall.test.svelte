<script lang="ts">
  import SpanWaterfall from "carbon-components-svelte/viz/SpanWaterfall/SpanWaterfall.svelte";

  type Span = {
    id: string;
    parent: string | null;
    name: string;
    service: string;
    start: number;
    ms: number;
  };

  export let data: ReadonlyArray<Span> = [
    {
      id: "gw",
      parent: null,
      name: "route",
      service: "gateway",
      start: 0,
      ms: 160,
    },
    {
      id: "api",
      parent: "gw",
      name: "GET /checkout",
      service: "api",
      start: 20,
      ms: 90,
    },
    {
      id: "db",
      parent: "api",
      name: "query orders",
      service: "db",
      start: 35,
      ms: 40,
    },
    {
      id: "auth",
      parent: "gw",
      name: "session",
      service: "auth",
      start: 22,
      ms: 28,
    },
    {
      id: "render",
      parent: "gw",
      name: "html",
      service: "api",
      start: 115,
      ms: 45,
    },
  ];
  export let collapsed: ReadonlyArray<string> = [];
  export let selectable = false;
  export let selected: string | null = null;
  export let criticalPath = true;
  export let onselect: (detail: unknown) => void = () => {};
  export let onhover: (detail: unknown) => void = () => {};
  export let ontoggle: (detail: unknown) => void = () => {};
</script>

<SpanWaterfall
  {data}
  id="id"
  parent="parent"
  start="start"
  duration="ms"
  label="name"
  group="service"
  title="Checkout trace"
  locale="en-US"
  {selectable}
  {criticalPath}
  bind:selected
  bind:collapsed
  data-testid="trace"
  on:select={(e) => onselect(e.detail)}
  on:hover={(e) => onhover(e.detail)}
  on:toggle={(e) => ontoggle(e.detail)}
/>
<output data-testid="selected">{selected ?? ""}</output>
<output data-testid="collapsed">{collapsed.join(",")}</output>
