<svelte:options accessors />

<script lang="ts">
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import TabsVertical from "carbon-components-svelte/Tabs/TabsVertical.svelte";

  export let count = 10;
</script>

<TabsVertical>
  {#each { length: count } as _, i}
    <Tab label={`Tab ${i}`} />
  {/each}
</TabsVertical>
