<script lang="ts">
  import BottomSheet from "carbon-components-svelte/BottomSheet/BottomSheet.svelte";
  import type { BottomSheetSnapPoint } from "carbon-components-svelte/BottomSheet/BottomSheet.svelte";

  export let open = true;
  export let snapPoint: BottomSheetSnapPoint | undefined = undefined;
  export let log: (name: string, detail?: unknown) => void = () => {};
</script>

<button type="button" data-testid="opener" on:click={() => (open = true)}
  >Open</button
>
<BottomSheet
  bind:open
  bind:snapPoint
  title="Filters"
  on:close={(e) => log("close", e.detail)}
  on:open={() => log("open")}
  on:snap={(e) => log("snap", e.detail)}
  {...$$restProps}
>
  <input aria-label="Name" />
</BottomSheet>
