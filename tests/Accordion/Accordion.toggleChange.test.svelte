<script lang="ts">
  import Accordion from "carbon-components-svelte/Accordion/Accordion.svelte";
  import AccordionItem from "carbon-components-svelte/Accordion/AccordionItem.svelte";
  import type { ComponentProps } from "svelte";

  export let type: ComponentProps<Accordion>["type"] = "multiple";
  export let open = false;
  export let thirdOpen = false;

  let showThird = true;
</script>

<button type="button" on:click={() => (showThird = false)}>Remove third</button>

<Accordion
  {type}
  on:toggle:change={(e) => {
    console.log("accordion-toggle-change", e.detail.openCount);
  }}
>
  <AccordionItem title="First" {open}>1</AccordionItem>
  <AccordionItem title="Second">2</AccordionItem>
  {#if showThird}
    <AccordionItem title="Third" open={thirdOpen}>3</AccordionItem>
  {/if}
</Accordion>
