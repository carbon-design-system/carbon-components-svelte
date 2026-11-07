<script lang="ts">
  import LikertMatrix from "carbon-components-svelte/SurveyScale/LikertMatrix.svelte";

  // The matrix's label is its legend, so map the contract's label props onto
  // it.
  export let hideLabel = false;
</script>

<LikertMatrix
  {...$$restProps}
  statements={[
    { id: "quick", text: "It was quick." },
    { id: "clear", text: "It was clear." },
  ]}
  hideLegend={hideLabel}
>
  <svelte:fragment slot="legendChildren"
    ><slot name="labelChildren" /></svelte:fragment
  >
</LikertMatrix>
