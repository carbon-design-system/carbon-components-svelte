<script>
  import { Accordion, AccordionItem } from "carbon-components-svelte";
</script>

<div class="fixture-container">
  <Accordion data-testid="accordion">
    <AccordionItem title="Section 1" data-testid="accordion-item-1">
      <p>Content for section 1</p>
    </AccordionItem>
    <AccordionItem title="Section 2" data-testid="accordion-item-2">
      <p>Content for section 2</p>
    </AccordionItem>
  </Accordion>
</div>

<style>
  .fixture-container {
    padding: 2rem;
  }
</style>
