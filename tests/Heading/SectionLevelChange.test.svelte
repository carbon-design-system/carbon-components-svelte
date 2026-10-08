<script lang="ts">
  import Heading from "carbon-components-svelte/Heading/Heading.svelte";
  import Section from "carbon-components-svelte/Heading/Section.svelte";

  let level: 1 | 3 = 1;
</script>

<button type="button" on:click={() => (level = 3)}>Set level 3</button>

<Section {level}>
  <Heading>Outer</Heading>
  <Section>
    <Heading>Inner</Heading>
  </Section>
</Section>
