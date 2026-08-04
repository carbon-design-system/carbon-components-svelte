<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";

  export let selectedIndex = 0;
  export let selectedId: string | undefined = undefined;
  export let showSwitchA = true;
  export let showSwitchB = true;
</script>

<ContentSwitcher
  bind:selectedIndex
  bind:selectedId
  on:change={({ detail }) => console.log("change event", detail)}
>
  {#if showSwitchA}
    <Switch id="switch-a" text="Switch A" />
  {/if}
  {#if showSwitchB}
    <Switch id="switch-b" text="Switch B" />
  {/if}
  <Switch id="switch-c" text="Switch C" />
</ContentSwitcher>

<button
  type="button"
  data-testid="toggle-switch-a"
  on:click={() => (showSwitchA = !showSwitchA)}
>
  Toggle Switch A
</button>
<button
  type="button"
  data-testid="toggle-switch-b"
  on:click={() => (showSwitchB = !showSwitchB)}
>
  Toggle Switch B
</button>
<div data-testid="selected-index">{selectedIndex}</div>
<div data-testid="selected-id">{selectedId ?? ""}</div>
