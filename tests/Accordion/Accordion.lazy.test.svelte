<script lang="ts">
  import Accordion from "carbon-components-svelte/Accordion/Accordion.svelte";
  import AccordionItem from "carbon-components-svelte/Accordion/AccordionItem.svelte";

  export let lazy = true;
  export let open = false;

  function logMount(_node: HTMLElement) {
    console.log("lazy-content-mounted");
  }
</script>

<Accordion>
  <AccordionItem title="Natural Language Classifier" {lazy} {open}>
    <p use:logMount>Lazy panel content</p>
  </AccordionItem>
</Accordion>
