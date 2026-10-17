<script>
  import { Accordion, AccordionItem } from "carbon-components-svelte";

  const text =
    "Accordion content long enough to wrap onto several lines in a narrow box.";
</script>

<!-- Accordions in boxes narrower and wider than the window's breakpoints,
     then in parents that size to their content. -->
{#each [320, 500, 900] as width}
  <div data-testid="box-{width}" style="width: {width}px; margin-bottom: 1rem;">
    <Accordion>
      <AccordionItem open title="Section">
        <p>{text}</p>
      </AccordionItem>
    </Accordion>
  </div>
{/each}
<div data-testid="flex-row" style="display: flex; margin-bottom: 1rem;">
  <Accordion>
    <AccordionItem open title="Section">
      <p>Short</p>
    </AccordionItem>
  </Accordion>
</div>
<div data-testid="inline-block" style="display: inline-block;">
  <Accordion>
    <AccordionItem open title="Section">
      <p>Short</p>
    </AccordionItem>
  </Accordion>
</div>
