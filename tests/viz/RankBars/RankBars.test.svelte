<script lang="ts">
  import RankBars from "carbon-components-svelte/viz/RankBars/RankBars.svelte";

  export let data = [
    { id: "edge", label: "Edge", value: 5 },
    { id: "chrome", label: "Chrome", value: 64, href: "/chrome" },
    { id: "firefox", label: "Firefox", value: 4 },
    { id: "safari", label: "Safari", value: 19, color: "success" },
    { id: "opera", label: "Opera", value: 8 },
  ];
  export let selectedId: string | undefined = undefined;
  export let onselect: (detail: unknown) => void = () => {};
  export let onhover: (detail: unknown) => void = () => {};
</script>

<RankBars {data} label="Browser share" data-testid="basic" />
<RankBars {data} data-testid="decorative" />
<RankBars
  {data}
  top={3}
  other
  otherLabel="Rest"
  valueType="percent"
  color={3}
  size="sm"
  label="Top browsers"
  data-testid="top"
/>
<RankBars
  {data}
  sort={false}
  hideRank
  format={(value) => `${value} pts`}
  label="Unsorted"
  data-testid="unsorted"
/>
<RankBars
  {data}
  top={3}
  selectable
  bind:selectedId
  label="Pick a browser"
  data-testid="selectable"
  on:select={(e) => onselect(e.detail)}
  on:hover={(e) => onhover(e.detail)}
/>
<output data-testid="selected">{selectedId ?? ""}</output>
