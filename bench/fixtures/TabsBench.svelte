<svelte:options accessors />

<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";

  export let count = 10;
</script>

<Tabs>
  {#each { length: count } as _, i}
    <Tab label={`Tab ${i}`} />
  {/each}
</Tabs>
