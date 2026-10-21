<script lang="ts">
  import Accordion from "carbon-components-svelte/Accordion/Accordion.svelte";
  import AccordionItem from "carbon-components-svelte/Accordion/AccordionItem.svelte";
  import Button from "carbon-components-svelte/Button/Button.svelte";

  export let open = false;
  export let disabled = false;
  export let accordionDisabled = false;
  export let onToggle: (open: boolean) => void = () => {};
</script>

<Button on:click={() => (disabled = !disabled)}>Toggle disabled</Button>

<Accordion disabled={accordionDisabled}>
  <AccordionItem
    title="Natural Language Classifier"
    {open}
    {disabled}
    on:toggle={(e) => onToggle(e.detail.open)}
  >
    <p>Natural Language Classifier content</p>
  </AccordionItem>
</Accordion>
