<script lang="ts">
  import ContentSwitcher from "carbon-components-svelte/ContentSwitcher/ContentSwitcher.svelte";
  import Switch from "carbon-components-svelte/ContentSwitcher/Switch.svelte";
  import Grid from "carbon-icons-svelte/lib/Grid.svelte";
  import List from "carbon-icons-svelte/lib/List.svelte";

  export let onParentKeydown: (event: KeyboardEvent) => void = () => {};
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div on:keydown={onParentKeydown}>
  <ContentSwitcher>
    <Switch text="Grid view" icon={Grid} />
    <Switch text="List view" icon={List} />
  </ContentSwitcher>
  <input aria-label="Other control">
</div>
