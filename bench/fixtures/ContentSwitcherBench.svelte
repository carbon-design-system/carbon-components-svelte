<svelte:options accessors />

<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";

  export let count = 100;
</script>

<ContentSwitcher>
  {#each { length: count } as _, i}
    <Switch text={`Switch ${i}`} />
  {/each}
</ContentSwitcher>
