<script lang="ts">
  import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";

  export let type: "single" | "inline" | "multi" = "multi";
  export let actions = false;
  export let disabled = false;
  export let previewLabelText: string | undefined = undefined;
  export let onPlay: () => void = () => {};
</script>

{#if actions}
  <CodeSnippet
    {type}
    {disabled}
    code="<Button>Save</Button>"
    {...previewLabelText ? { previewLabelText } : {}}
  >
    <svelte:fragment slot="previewActions">
      <button type="button" on:click={onPlay}>Play</button>
    </svelte:fragment>
    <svelte:fragment slot="preview">
      <button type="button">Save</button>
    </svelte:fragment>
  </CodeSnippet>
{:else}
  <CodeSnippet
    {type}
    {disabled}
    code="<Button>Save</Button>"
    {...previewLabelText ? { previewLabelText } : {}}
  >
    <svelte:fragment slot="preview">
      <button type="button">Save</button>
    </svelte:fragment>
  </CodeSnippet>
{/if}
