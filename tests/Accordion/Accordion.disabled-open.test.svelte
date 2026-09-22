<script lang="ts">
  import Accordion from "carbon-components-svelte/Accordion/Accordion.svelte";
  import AccordionItem from "carbon-components-svelte/Accordion/AccordionItem.svelte";
  import Button from "carbon-components-svelte/Button/Button.svelte";

  export let open = false;
  export let disabled = false;
</script>

<Button on:click={() => (disabled = !disabled)}>Toggle disabled</Button>

<Accordion>
  <AccordionItem title="Natural Language Classifier" {open} {disabled}>
    <p>Natural Language Classifier content</p>
  </AccordionItem>
</Accordion>
