<script>
  import { Button, CodeSnippet, InlineLoading } from "carbon-components-svelte";

  const code = `{#if saving}
  <InlineLoading description="Saving..." />
{:else}
  <InlineLoading status="finished" description="Saved" />
{/if}`;

  let saving = false;

  async function simulate() {
    saving = true;
    await new Promise((resolve) => setTimeout(resolve, 1500));
    saving = false;
  }
</script>

<CodeSnippet type="multi" {code}>
  <svelte:fragment slot="previewActions">
    <Button kind="ghost" size="small" disabled={saving} on:click={simulate}>
      Simulate saving
    </Button>
  </svelte:fragment>
  <svelte:fragment slot="preview">
    {#if saving}
      <InlineLoading description="Saving..." />
    {:else}
      <InlineLoading status="finished" description="Saved" />
    {/if}
  </svelte:fragment>
</CodeSnippet>
