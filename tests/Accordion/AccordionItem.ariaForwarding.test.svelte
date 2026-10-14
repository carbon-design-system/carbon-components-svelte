<script lang="ts">
  import Accordion from "carbon-components-svelte/Accordion/Accordion.svelte";
  import AccordionItem from "carbon-components-svelte/Accordion/AccordionItem.svelte";

  export let itemProps: Record<string, unknown> = {};
</script>

<span id="extra-help">Extra help</span>
<span id="external-name">External name</span>
<Accordion>
  <AccordionItem title="Section" data-testid="item" {...itemProps}>
    Content
  </AccordionItem>
</Accordion>
