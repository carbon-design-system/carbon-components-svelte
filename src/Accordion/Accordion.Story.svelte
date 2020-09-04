<script>
  export let story = undefined;
  export let title = undefined;
  export let open = undefined;
  export let count = undefined;

  import Accordion from "./Accordion.svelte";
  import AccordionItem from "./AccordionItem.svelte";
  import AccordionSkeleton from "./Accordion.Skeleton.svelte";
</script>

{#if story === 'skeleton'}
  <div style="width: 500px">
    <AccordionSkeleton open="{open}" count="{count}" />
  </div>
{:else}
  <Accordion {...$$restProps}>
    <AccordionItem title="{title}" open="{open}">
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat.
      </p>
    </AccordionItem>
    <AccordionItem title="Section 2 title">
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat.
      </p>
    </AccordionItem>
    <AccordionItem title="Section 3 title">
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat.
      </p>
    </AccordionItem>
    <AccordionItem>
      <div slot="title">
        Section 4 title ( <em>the title can be a node</em> )
      </div>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat.
      </p>
    </AccordionItem>
  </Accordion>
{/if}
