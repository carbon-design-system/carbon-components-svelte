<script>
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

<div style="width: 480px">
  <Accordion fullWidthContent data-testid="accordion-full-width">
    <AccordionItem open title="Quiet hours">
      <p>Notifications pause between these times.</p>
    </AccordionItem>
  </Accordion>
</div>
