<script lang="ts">
  import Accordion from "carbon-components-svelte/Accordion/Accordion.svelte";
  import AccordionItem from "carbon-components-svelte/Accordion/AccordionItem.svelte";

  const items = [
    {
      title: "Natural Language Classifier",
      description:
        "Natural Language Classifier uses advanced natural language processing and machine learning techniques to create custom classification models.",
    },
    {
      title: "Natural Language Understanding",
      description:
        "Analyze text to extract meta-data from content such as concepts, entities, emotion, relations, sentiment and more.",
    },
    {
      title: "Language Translator",
      description:
        "Translate text, documents, and websites from one language to another.",
    },
  ];
</script>

<Accordion type="single">
  {#each items as item}
    <AccordionItem title={item.title}>
      <p>{item.description}</p>
    </AccordionItem>
  {/each}
</Accordion>
