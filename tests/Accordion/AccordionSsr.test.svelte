<script lang="ts">
  import Accordion from "carbon-components-svelte/Accordion/Accordion.svelte";
  import AccordionItem from "carbon-components-svelte/Accordion/AccordionItem.svelte";

  export let firstId: string | undefined = undefined;
  export let secondId: string | undefined = undefined;
</script>

<Accordion>
  <AccordionItem id={firstId} title="First" open>One</AccordionItem>
  <AccordionItem id={secondId} title="Second">Two</AccordionItem>
</Accordion>
