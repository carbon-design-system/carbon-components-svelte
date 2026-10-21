<svelte:options accessors />

<script lang="ts">
  import Accordion from "carbon-components-svelte/Accordion/Accordion.svelte";
  import AccordionItem from "carbon-components-svelte/Accordion/AccordionItem.svelte";
  import type { ComponentProps } from "svelte";

  export let align: ComponentProps<Accordion>["align"] = undefined;
  export let size: ComponentProps<Accordion>["size"] = undefined;
  export let flush: ComponentProps<Accordion>["flush"] = false;
  export let customClass = "";
  export let itemClass = "";
  export let useSlot = false;
  export let noTitle = false;
  export let ref: ComponentProps<AccordionItem>["ref"] = null;
  export let onClick: () => void = () => {};
  export let onMouseover: () => void = () => {};
  export let onMouseenter: () => void = () => {};
  export let onMouseleave: () => void = () => {};
  export let onItemClick: () => void = () => {};
  export let onFocus: () => void = () => {};
  export let onBlur: () => void = () => {};
  export let onKeydown: (key: string) => void = () => {};
  export let onToggle: (open: boolean) => void = () => {};
</script>

<Accordion
  {align}
  {size}
  {flush}
  class={customClass}
  on:click={() => onClick()}
  on:mouseover={() => onMouseover()}
  on:mouseenter={() => onMouseenter()}
  on:mouseleave={() => onMouseleave()}
>
  {#if useSlot}
    <AccordionItem class={itemClass}>
      <div slot="title">Custom Title</div>
      Slot content
    </AccordionItem>
  {:else if noTitle}
    <AccordionItem>No title content</AccordionItem>
  {:else}
    <AccordionItem title="Natural Language Classifier" bind:ref
      >1</AccordionItem
    >
    <AccordionItem title="Natural Language Understanding" disabled
      >2</AccordionItem
    >
    <AccordionItem
      title="Language Translator"
      class={itemClass}
      on:click={() => onItemClick()}
      on:focus={() => onFocus()}
      on:blur={() => onBlur()}
      on:keydown={(e) => onKeydown(e.key)}
      on:toggle={(e) => onToggle(e.detail.open)}
      >3</AccordionItem
    >
  {/if}
</Accordion>
