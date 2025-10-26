<script lang="ts">
  import { Tab, Tabs } from "carbon-components-svelte";

  export let label = "Test Tab";
  export let href = "#test";
  export let disabled = false;
  export let tabindex = "0";
  export let id = "test-tab";
  export let useSlot = false;
</script>

<Tabs>
  {#if useSlot}
    <Tab {href} {disabled} {tabindex} {id}>
      <span>Slot content</span>
    </Tab>
  {:else}
    <Tab {label} {href} {disabled} {tabindex} {id} />
  {/if}
  <svelte:fragment slot="content">
    <div>Test Content</div>
  </svelte:fragment>
</Tabs>
