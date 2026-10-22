<script lang="ts">
  import WordCloudChart from "carbon-components-svelte/viz/WordCloudChart/WordCloudChart.svelte";

  type Row = { term: string; kind: string; mentions: number };

  export let data: ReadonlyArray<Row> = [
    { term: "latency", kind: "symptom", mentions: 60 },
    { term: "latency", kind: "symptom", mentions: 40 },
    { term: "timeout", kind: "symptom", mentions: 70 },
    { term: "deploy", kind: "cause", mentions: 50 },
    { term: "cache", kind: "cause", mentions: 20 },
    { term: "ignored", kind: "cause", mentions: 0 },
  ];
  export let grouped = false;
  export let onhover: (detail: unknown) => void = () => {};
  export let onselect: (detail: unknown) => void = () => {};
</script>

<WordCloudChart
  {data}
  word="term"
  value="mentions"
  group={grouped ? "kind" : undefined}
  title="Incident terms"
  locale="en-US"
  on:hover={(e) => onhover(e.detail)}
  on:select={(e) => onselect(e.detail)}
/>
