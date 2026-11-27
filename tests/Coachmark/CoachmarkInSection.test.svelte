<script lang="ts">
  import Coachmark from "carbon-components-svelte/Coachmark/Coachmark.svelte";
  import Heading from "carbon-components-svelte/Heading/Heading.svelte";
  import Section from "carbon-components-svelte/Heading/Section.svelte";

  export let level: 1 | 2 | 3 | 4 | 5 | 6 = 3;
</script>

<Section {level}>
  <Heading>Reports</Heading>
  <Coachmark titleText="Export in bulk" open>Select rows first.</Coachmark>
</Section>
