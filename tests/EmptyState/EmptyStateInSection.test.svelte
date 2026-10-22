<script lang="ts">
  import EmptyState from "carbon-components-svelte/EmptyState/EmptyState.svelte";
  import Heading from "carbon-components-svelte/Heading/Heading.svelte";
  import Section from "carbon-components-svelte/Heading/Section.svelte";

  export let level: 1 | 2 | 3 | 4 | 5 | 6 = 4;
</script>

<Section {level}>
  <Heading>Files</Heading>
  <EmptyState title="No files yet" />
</Section>
