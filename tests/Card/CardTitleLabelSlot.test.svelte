<script lang="ts">
  import CardTitle from "carbon-components-svelte/Card/CardTitle.svelte";

  /** Which label slots to pass: the new name, the deprecated one, or both. */
  export let slots: "labelChildren" | "label" | "both" = "labelChildren";
</script>

{#if slots === "labelChildren"}
  <CardTitle>
    <svelte:fragment slot="labelChildren">New label</svelte:fragment>
    Quarterly report
  </CardTitle>
{:else if slots === "label"}
  <CardTitle>
    <svelte:fragment slot="label">Old label</svelte:fragment>
    Quarterly report
  </CardTitle>
{:else}
  <CardTitle>
    <svelte:fragment slot="labelChildren">New label</svelte:fragment>
    <svelte:fragment slot="label">Old label</svelte:fragment>
    Quarterly report
  </CardTitle>
{/if}
