<svelte:options accessors />

<script lang="ts">
  import CopyText from "carbon-components-svelte/CopyText/CopyText.svelte";
  import type { ComponentProps } from "svelte";

  export let text: ComponentProps<CopyText>["text"] = undefined;
  export let useSlot = false;
  export let richSlot = false;
  export let copy: ComponentProps<CopyText>["copy"] = undefined;
  export let ref: ComponentProps<CopyText>["ref"] = null;
  export let extra: Record<string, unknown> = {};
</script>

{#if richSlot}
  <CopyText {...extra} bind:ref data-testid="copy-text">
    <strong>host</strong>:<em>5432</em>
  </CopyText>
{:else if useSlot}
  <CopyText
    {text}
    {...copy ? { copy } : {}}
    {...extra}
    bind:ref
    data-testid="copy-text"
    on:copy={() => console.log("copied")}
    on:copy:error={() => console.log("copy-error")}
  >
    slotted value
  </CopyText>
{:else}
  <CopyText
    {text}
    {...copy ? { copy } : {}}
    {...extra}
    bind:ref
    data-testid="copy-text"
    on:copy={() => console.log("copied")}
    on:copy:error={() => console.log("copy-error")}
  />
{/if}
