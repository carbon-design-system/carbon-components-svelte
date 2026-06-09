<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";

  export let show = true;
</script>

<ContentSwitcher>
  <Switch text="First" />
  {#if show}
    <Switch text="Middle" />
  {/if}
  <Switch text="Last" />
</ContentSwitcher>
