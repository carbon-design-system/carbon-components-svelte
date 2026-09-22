<script lang="ts">
  import Accordion from "carbon-components-svelte/Accordion/Accordion.svelte";
  import AccordionItem from "carbon-components-svelte/Accordion/AccordionItem.svelte";
  import type { ComponentProps } from "svelte";

  export let type: ComponentProps<Accordion>["type"] = "multiple";
</script>

<Accordion {type}>
  <AccordionItem title="First" open>1</AccordionItem>
  <AccordionItem title="Second" open>2</AccordionItem>
</Accordion>
