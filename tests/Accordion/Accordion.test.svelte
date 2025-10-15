<script lang="ts">
  import { Accordion, AccordionItem } from "carbon-components-svelte";

  export let align: "start" | "end" = "end";
  export let size: "sm" | "xl" | undefined = undefined;
  export let customClass = "";
  export let itemClass = "";
  export let useSlot = false;
  export let iconDescription = "Expand/Collapse";
</script>

<Accordion
  {align}
  {size}
  class={customClass}
  on:click={() => {
    console.log("accordion-click");
  }}
  on:mouseover={() => {
    console.log("accordion-mouseover");
  }}
  on:mouseenter={() => {
    console.log("accordion-mouseenter");
  }}
  on:mouseleave={() => {
    console.log("accordion-mouseleave");
  }}
>
  {#if useSlot}
    <AccordionItem class={itemClass} {iconDescription}>
      <div slot="title">Custom Title</div>
      Slot content
    </AccordionItem>
  {:else}
    <AccordionItem title="Natural Language Classifier">1</AccordionItem>
    <AccordionItem title="Natural Language Understanding" disabled
      >2</AccordionItem
    >
    <AccordionItem
      title="Language Translator"
      class={itemClass}
      on:click={() => {
        console.log("item-click");
      }}
      on:keydown={(e) => {
        console.log("item-keydown", e.key);
      }}
      on:animationend={() => {
        console.log("item-animationend");
      }}>3</AccordionItem
    >
  {/if}
</Accordion>
