<script lang="ts">
  import Toggletip from "carbon-components-svelte/Toggletip/Toggletip.svelte";

  /** Which label slots to pass: the new name, the deprecated one, or both. */
  export let slots: "labelChildren" | "labelText" | "both" = "labelChildren";
</script>

{#if slots === "labelChildren"}
  <Toggletip>
    <strong slot="labelChildren">New label</strong>
    Content
  </Toggletip>
{:else if slots === "labelText"}
  <Toggletip>
    <strong slot="labelText">Old label</strong>
    Content
  </Toggletip>
{:else}
  <Toggletip>
    <strong slot="labelChildren">New label</strong>
    <strong slot="labelText">Old label</strong>
    Content
  </Toggletip>
{/if}
