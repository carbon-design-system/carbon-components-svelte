<script lang="ts">
  import Accordion from "carbon-components-svelte/Accordion/Accordion.svelte";
  import AccordionItem from "carbon-components-svelte/Accordion/AccordionItem.svelte";
</script>

<Accordion>
  <AccordionItem title="Outer one" open>
    <input aria-label="Notes" />
    <Accordion>
      <AccordionItem title="Inner one" />
      <AccordionItem title="Inner two" />
    </Accordion>
  </AccordionItem>
  <AccordionItem title="Outer two" />
</Accordion>
