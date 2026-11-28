<script lang="ts">
  import {
    Button,
    CodeSnippet,
    InlineLoading,
    Layer,
  } from "carbon-components-svelte";

  const saveCode = `<Button kind="primary">Save changes</Button>`;
  const loadingCode = `{#if saving}
  <InlineLoading description="Saving..." />
{:else}
  <p>Changes are saved automatically.</p>
{/if}`;
  const longCode = Array.from(
    { length: 24 },
    (_, i) => `<Button kind="ghost">Region us-east-${i + 1}</Button>`,
  ).join("\n");

  let saving = false;
  let runs = 0;
</script>

<div data-testid="plain" class="case">
  <CodeSnippet type="multi" code={saveCode} data-testid="snippet-plain">
    <svelte:fragment slot="preview">
      <Button>Save changes</Button>
    </svelte:fragment>
  </CodeSnippet>
</div>

<div data-testid="actions" class="case">
  <CodeSnippet
    type="multi"
    title="SaveStatus.svelte"
    code={loadingCode}
    data-testid="snippet-actions"
  >
    <svelte:fragment slot="previewActions">
      <Button
        kind="ghost"
        size="small"
        data-testid="play"
        on:click={() => {
          saving = !saving;
          runs += 1;
        }}>{saving ? "Stop" : "Simulate saving"}</Button
      >
    </svelte:fragment>
    <svelte:fragment slot="preview">
      {#if saving}
        <InlineLoading description="Saving..." />
      {:else}
        <p data-testid="idle" dir="auto">Changes are saved automatically.</p>
      {/if}
    </svelte:fragment>
  </CodeSnippet>
  <p data-testid="runs">{runs}</p>
</div>

<div data-testid="long" class="case">
  <CodeSnippet type="multi" code={longCode} data-testid="snippet-long">
    <svelte:fragment slot="preview">
      <Button kind="ghost">Region us-east-1</Button>
    </svelte:fragment>
  </CodeSnippet>
</div>

<div data-testid="disabled" class="case">
  <CodeSnippet
    type="multi"
    disabled
    code={saveCode}
    data-testid="snippet-disabled"
  >
    <svelte:fragment slot="previewActions">
      <Button kind="ghost" size="small">Simulate saving</Button>
    </svelte:fragment>
    <svelte:fragment slot="preview">
      <Button>Save changes</Button>
    </svelte:fragment>
  </CodeSnippet>
</div>

<div data-testid="single" class="case">
  <CodeSnippet
    code="npm i carbon-components-svelte"
    data-testid="snippet-single"
  >
    <svelte:fragment slot="preview">
      <Button>Not rendered</Button>
    </svelte:fragment>
  </CodeSnippet>
</div>

<Layer withBackground>
  <div data-testid="layer" class="case">
    <CodeSnippet type="multi" code={saveCode} data-testid="snippet-layer">
      <svelte:fragment slot="preview">
        <Button>Save changes</Button>
      </svelte:fragment>
    </CodeSnippet>
  </div>
</Layer>

<style>
  .case {
    margin-bottom: 1.5rem;
  }
</style>
