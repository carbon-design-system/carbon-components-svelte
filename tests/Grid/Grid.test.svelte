<script lang="ts">
  import { Grid } from "carbon-components-svelte";

  export let condensed = false;
  export let narrow = false;
  export let fullWidth = false;
  export let noGutter = false;
  export let noGutterLeft = false;
  export let noGutterRight = false;
  export let padding = false;
  export let as = false;
</script>

{#if as}
  <Grid
    {as}
    {condensed}
    {narrow}
    {fullWidth}
    {noGutter}
    {noGutterLeft}
    {noGutterRight}
    {padding}
    {...$$restProps}
    let:props
  >
    <header {...props}>
      <slot />
    </header>
  </Grid>
{:else}
  <Grid
    {condensed}
    {narrow}
    {fullWidth}
    {noGutter}
    {noGutterLeft}
    {noGutterRight}
    {padding}
    {...$$restProps}
  >
    <slot />
  </Grid>
{/if}
