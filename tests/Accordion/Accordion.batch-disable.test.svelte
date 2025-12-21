<script lang="ts">
  import {
    Accordion,
    AccordionItem,
    Button,
    ButtonSet,
  } from "carbon-components-svelte";

  export let disabled = false;

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

<ButtonSet>
  <Button size="field" {disabled} on:click={() => (open = !open)}>
    {open ? "Collapse" : "Expand"} all
  </Button>
  <Button
    kind="ghost"
    size="field"
    on:click={() => {
      disabled = !disabled;
      if (disabled) {
        open = false;
      }
    }}
  >
    {disabled ? "Enable" : "Disable"} all
  </Button>
</ButtonSet>

<Accordion {disabled}>
  {#each items as item}
    <AccordionItem title={item.title} {open}>
      <p>{item.description}</p>
    </AccordionItem>
  {/each}
</Accordion>

