<script lang="ts">
  import { Splitter, WebTerminal } from "carbon-components-svelte";

  let open = true;
  let size = 60;
  let maximized = false;

  function execute(command: string) {
    return `ran ${command}`;
  }
</script>

<div data-testid="host" style="max-width: 960px; height: 480px">
  <Splitter
    orientation="vertical"
    bind:size
    bind:collapsed={maximized}
    collapsedSize={0}
    min="96px"
    max={85}
    separatorLabel="Resize terminal"
  >
    <div slot="start" style="padding: 1rem">
      <h1>Cluster</h1>
      <p>Page content above the docked terminal.</p>
      <button type="button" on:click={() => (open = !open)}>Toggle</button>
    </div>
    <svelte:fragment slot="end">
      {#if open}
        <WebTerminal
          {execute}
          height="100%"
          maximizable
          bind:maximized
          title="Cluster shell"
          labelText="Cluster shell output"
          data-testid="terminal"
        />
      {/if}
    </svelte:fragment>
  </Splitter>
</div>
<p data-testid="size">{Math.round(size)}</p>
<p data-testid="maximized">{maximized}</p>
