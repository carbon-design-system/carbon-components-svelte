<script>
  import { Button } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
</script>

<!--
  Loading ghost and danger-ghost buttons, with the spinner over the label
  and icon-only, and shortcut buttons in the small sizes. CSS coverage for
  the `.bx--btn__loading` and `--shortcut-*` rules no other fixture renders.
-->
<div class="row" data-testid="loading">
  {#each ["ghost", "danger-ghost"] as kind}
    <Button {kind} loading loadingDelay={0}>Saving</Button>
    <Button {kind} icon={Add} iconDescription="Add" loading loadingDelay={0} />
    <Button
      {kind}
      icon={Add}
      iconDescription="Add"
      loading
      loadingDelay={0}
      disabled
    />
  {/each}
</div>
<div class="row" data-testid="shortcut">
  {#each ["xs", "sm"] as size}
    <Button {size} shortcut="mod+s">Save</Button>
    <Button {size} kind="ghost" icon={Add} shortcut="mod+s">Save</Button>
  {/each}
</div>

<style>
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }
</style>
