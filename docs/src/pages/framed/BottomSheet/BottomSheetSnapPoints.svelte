<script>
  import {
    BottomSheet,
    Button,
    ButtonSet,
    Stack,
  } from "carbon-components-svelte";

  let open = true;
  /** @typedef {import("carbon-components-svelte/BottomSheet/BottomSheet.svelte").BottomSheetSnapPoint} SnapPoint */

  /** @type {SnapPoint[]} */
  const snapPoints = ["peek", "40%", 480, "full"];

  /** @type {SnapPoint} */
  let snapPoint = "40%";
  let log = [];
</script>

<Stack gap={4}>
  <Button on:click={() => (open = true)}>Open</Button>
  <ButtonSet>
    {#each snapPoints as point}
      <Button
        kind={snapPoint === point ? "primary" : "tertiary"}
        size="small"
        on:click={() => (snapPoint = point)}>{point}</Button
      >
    {/each}
  </ButtonSet>
  <p>Snap point: {snapPoint}</p>
  <p>Moved by the user: {log.join(", ") || "none yet"}</p>
</Stack>

<BottomSheet
  bind:open
  bind:snapPoint
  title="Details"
  {snapPoints}
  breakpoint={false}
  modal={false}
  on:snap={(e) =>
    (log = [...log, `${e.detail.snapPoint} (${e.detail.trigger})`])}
>
  <p>
    The sheet opens at the shortest snap point. Drag the grabber, or focus it
    and press the arrow keys.
  </p>
</BottomSheet>
