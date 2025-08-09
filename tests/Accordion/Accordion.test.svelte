<script lang="ts">
  import { Accordion, AccordionItem } from "carbon-components-svelte";

  export let align: "start" | "end" = "end";
  export let size: "sm" | "xl" | undefined = undefined;
</script>

<Accordion {align} {size}>
  <AccordionItem title="Natural Language Classifier">1</AccordionItem>
  <AccordionItem title="Natural Language Understanding" disabled
    >2</AccordionItem
  >
  <AccordionItem title="Language Translator">3</AccordionItem>
</Accordion>
