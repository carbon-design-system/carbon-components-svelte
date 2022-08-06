<script>
  import { Accordion, AccordionItem, Button } from "carbon-components-svelte";

  const items = [
    {
      title: "Natural Language Classifier",
      description:
        "Natural Language Classifier uses advanced natural language processing and machine learning techniques to create custom classification models. Users train their data and the service predicts the appropriate category for the inputted text.",
    },
    {
      title: "Natural Language Understanding",
      description:
        "Analyze text to extract meta-data from content such as concepts, entities, emotion, relations, sentiment and more.",
    },
    {
      title: "Language Translator",
      description:
        "Translate text, documents, and websites from one language to another. Create industry or region-specific translations via the service's customization capability.",
    },
  ];

  let open = false;
</script>

<Button kind="ghost" size="field" on:click="{() => (open = !open)}">
  {open ? "Collapse" : "Expand"}
  all
</Button>

<Accordion>
  {#each items as item}
    <AccordionItem title="{item.title}" open="{open}">
      <p>{item.description}</p>
    </AccordionItem>
  {/each}
</Accordion>
