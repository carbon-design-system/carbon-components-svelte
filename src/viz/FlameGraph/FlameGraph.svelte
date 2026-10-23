<svelte:options immutable />

<script>
  /**
   * @template [T=any]
   */

  /**
   * @extends {"../IcicleChart/IcicleChart.svelte"} IcicleChartProps
   * @event {{ id: string; parent: string | null; label: string; depth: number; value: number; own: number; share: number; leaf: boolean; datum: T; index: number } | null} hover Fires when the pointer or focus enters a frame, and with `null` when it leaves.
   * @event {{ node: { id: string; parent: string | null; label: string; depth: number; value: number; own: number; share: number; leaf: boolean; datum: T; index: number }; originalEvent: Event }} select Fires when a frame is activated by click or keyboard. Requires `selectable`.
   */

  /**
   * Specify the frame to show from. Its callers stay above it at full
   * width, as steps back up. Bind it to drill in from `select`.
   * @type {string | number | null}
   */
  export let root = null;

  /**
   * Specify the selected frame, as its id.
   * @type {string | null}
   */
  export let selected = null;

  /**
   * Obtain a reference to the figure element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import IcicleChart from "../IcicleChart/IcicleChart.svelte";
  /** Set to `true` to show a skeleton while the data is on its way */
  export let loading = false;

  /** Specify the text shown when there is no data */
  export let emptyText = "No data";
</script>

<!-- A flame graph is an icicle stood on its head: the root at the bottom
     and the deepest frames on top. -->
<IcicleChart
  {loading}
  {emptyText}
  direction="up"
  bind:root
  bind:selected
  bind:ref
  {...$$restProps}
  on:hover
  on:select
/>
