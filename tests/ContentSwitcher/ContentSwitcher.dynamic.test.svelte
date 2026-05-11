<script lang="ts">
  import { ContentSwitcher, Switch } from "carbon-components-svelte";

  export let show = true;
</script>

<ContentSwitcher>
  <Switch text="First" />
  {#if show}
    <Switch text="Middle" />
  {/if}
  <Switch text="Last" />
</ContentSwitcher>
