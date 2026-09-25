<script>
  import Column from "./Column.svelte";
  import Grid from "./Grid.svelte";
  import Row from "./Row.svelte";

  /**
   * @restProps {div}
   */

  /** Set to `true` to show the overlay. The caller controls this; GridOverlay never toggles its own visibility (no keyboard shortcut, no internal state). */
  export let open = false;

  /** Set to `true` to match a condensed Grid. */
  export let condensed = false;

  /** Set to `true` to match a narrow Grid. */
  export let narrow = false;

  /** Set to `true` to match a fullWidth Grid. */
  export let fullWidth = false;

  /** Set to `true` to shade each column's gutter padding darker than its content area. */
  export let gutters = false;

  // 16 slots cover every breakpoint's column count (sm: 4, md: 8, lg/xlg/max: 16).
  // Each slot hides itself (span 0) once its index passes that breakpoint's
  // column count, and always shows (span 1) at lg/xlg/max, which are all
  // 16-column in this library's build (css/all.scss sets grid-columns-16: true).
  const SLOTS = Array.from({ length: 16 }, (_, i) => ({
    sm: i < 4 ? 1 : 0,
    md: i < 8 ? 1 : 0,
    lg: 1,
    xlg: 1,
    max: 1,
  }));

  $: overlayClass = [
    $$restProps.class,
    "bx--grid-overlay",
    gutters && "bx--grid-overlay--gutters",
  ]
    .filter(Boolean)
    .join(" ");
</script>

{#if open}
  <Grid {condensed} {narrow} {fullWidth} {...$$restProps} class={overlayClass}>
    <Row class="bx--grid-overlay__row">
      {#each SLOTS as slot, i (i)}
        <Column
          sm={slot.sm}
          md={slot.md}
          lg={slot.lg}
          xlg={slot.xlg}
          max={slot.max}
          class="bx--grid-overlay__col"
        />
      {/each}
    </Row>
  </Grid>
{/if}
