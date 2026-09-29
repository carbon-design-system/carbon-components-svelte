<svelte:options accessors />

<script lang="ts">
  import AccordionSearch from "carbon-components-svelte/Accordion/AccordionSearch.svelte";
  import type { ComponentProps } from "svelte";

  export let filterText: ComponentProps<AccordionSearch>["filterText"] = "";
  export let items: ComponentProps<AccordionSearch>["items"] = [
    {
      id: 1,
      title: "Natural Language Classifier",
      description: "Classifies text.",
    },
    {
      id: 2,
      title: "Natural Language Understanding",
      description: "Extracts meta-data.",
    },
    { id: 3, title: "Language Translator", description: "Translates text." },
  ];
</script>

<AccordionSearch {items} bind:filterText />
