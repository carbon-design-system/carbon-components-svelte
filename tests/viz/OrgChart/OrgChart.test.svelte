<script lang="ts">
  import OrgChart from "carbon-components-svelte/viz/OrgChart/OrgChart.svelte";

  type Person = {
    id: string;
    manager: string | null;
    name: string;
    title: string;
    team?: string;
  };

  export let data: ReadonlyArray<Person> = [
    { id: "vp", manager: null, name: "A. Rivera", title: "VP Engineering" },
    {
      id: "plat",
      manager: "vp",
      name: "K. Chen",
      title: "Director, Platform",
      team: "Platform",
    },
    {
      id: "prod",
      manager: "vp",
      name: "J. Patel",
      title: "Director, Product",
      team: "Product",
    },
    {
      id: "obs",
      manager: "plat",
      name: "M. Lee",
      title: "Observability",
      team: "Platform",
    },
    {
      id: "infra",
      manager: "plat",
      name: "S. Okafor",
      title: "Infrastructure",
      team: "Platform",
    },
    {
      id: "checkout",
      manager: "prod",
      name: "S. Ng",
      title: "Checkout",
      team: "Product",
    },
  ];
  export let withGroups = false;
  export let collapsed: ReadonlyArray<string> = [];
  export let selected: string | null = null;
  export let onselect: (detail: unknown) => void = () => {};
  export let ontoggle: (detail: unknown) => void = () => {};
  export let onhover: (detail: unknown) => void = () => {};
</script>

<OrgChart
  {data}
  id="id"
  parent="manager"
  label="name"
  sublabel="title"
  group={withGroups ? "team" : undefined}
  title="Engineering org"
  bind:collapsed
  bind:selected
  data-testid="org"
  on:select={(e) => onselect(e.detail)}
  on:toggle={(e) => ontoggle(e.detail)}
  on:hover={(e) => onhover(e.detail)}
/>
<output data-testid="collapsed">{collapsed.join(",")}</output>
<output data-testid="selected">{selected ?? ""}</output>
