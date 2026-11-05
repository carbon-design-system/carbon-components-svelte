<script lang="ts">
  import InlineLoading from "carbon-components-svelte/InlineLoading/InlineLoading.svelte";

  let status: "active" | "finished" = "active";
</script>

<button
  data-testid="finish"
  type="button"
  on:click={() => (status = "finished")}
>
  Finish
</button>

<!-- Changes status in front of the user. -->
<div data-testid="live">
  <InlineLoading
    {status}
    description={status === "active" ? "Saving" : "Saved"}
  />
</div>

<!-- Renders finished, as server HTML does. -->
<div data-testid="initial">
  <InlineLoading status="finished" description="Saved" />
</div>
