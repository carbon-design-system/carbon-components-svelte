<script lang="ts">
  import Heading from "carbon-components-svelte/Heading/Heading.svelte";
  import Section from "carbon-components-svelte/Heading/Section.svelte";
  import Timeline from "carbon-components-svelte/Timeline/Timeline.svelte";

  export let level: 1 | 2 | 3 | 4 | 5 | 6 = 2;
  export let headingLevel: 2 | 3 | 4 | 5 | 6 | undefined = undefined;
</script>

<Section {level}>
  <Heading>Deploys</Heading>
  <Timeline
    groupBy="day"
    {headingLevel}
    now={Date.parse("2026-11-06T15:00:00Z")}
    locale="en-US"
    timeZone="UTC"
    items={[{ id: "a", time: "2026-11-06T14:20:00Z", titleText: "Deployed" }]}
  />
</Section>
