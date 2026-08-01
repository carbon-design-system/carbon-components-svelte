<script lang="ts">
  import Accordion from "carbon-components-svelte/Accordion/Accordion.svelte";
  import AccordionItem from "carbon-components-svelte/Accordion/AccordionItem.svelte";

  export let withExtra = true;
</script>

<Accordion>
  {#if withExtra}
    <AccordionItem title="Natural Language Classifier">
      <svelte:fragment slot="extra">
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
