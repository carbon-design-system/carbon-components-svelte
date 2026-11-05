<script lang="ts">
  import { Accordion, AccordionItem } from "carbon-components-svelte";
</script>

<Accordion data-testid="accordion">
  <AccordionItem title="Section 1" data-testid="accordion-item-1">
    <p>Content for section 1</p>
  </AccordionItem>
  <AccordionItem title="Section 2" data-testid="accordion-item-2">
    <p>Content for section 2</p>
  </AccordionItem>
</Accordion>

<Accordion align="start" data-testid="accordion-start">
  <AccordionItem title="Start 1">
    <p>Content for start 1</p>
  </AccordionItem>
</Accordion>
