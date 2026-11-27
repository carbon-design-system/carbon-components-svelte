<script lang="ts">
  import Accordion from "carbon-components-svelte/Accordion/Accordion.svelte";
  import AccordionItem from "carbon-components-svelte/Accordion/AccordionItem.svelte";

  export let withHeadingEnd = true;
</script>

<Accordion>
  {#if withHeadingEnd}
    <AccordionItem title="Natural Language Classifier">
      <svelte:fragment slot="headingEnd">
        <span>3 errors</span>
        <button type="button">Manage</button>
      </svelte:fragment>
      <p>Natural Language Classifier</p>
    </AccordionItem>
  {:else}
    <AccordionItem title="Natural Language Classifier">
      <p>Natural Language Classifier</p>
    </AccordionItem>
  {/if}
</Accordion>
