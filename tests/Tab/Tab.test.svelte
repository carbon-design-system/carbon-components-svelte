<script lang="ts">
  import { Tabs, Tab } from "carbon-components-svelte";

  export let label = "Test Tab";
  export let href = "#test";
  export let disabled = false;
  export let tabindex = "0";
  export let id = "test-tab";
</script>

<Tabs>
  <Tab {label} {href} {disabled} {tabindex} {id} />
  <svelte:fragment slot="content">
    <div>Test Content</div>
  </svelte:fragment>
</Tabs>
