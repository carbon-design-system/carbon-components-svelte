<script lang="ts">
  import SurveyScale from "carbon-components-svelte/SurveyScale/SurveyScale.svelte";

  // The scale's label is its legend, so map the contract's label props onto
  // it. Likert draws its labels, so the group carries no end description
  // beside the messages the contract checks.
  export let hideLabel = false;
</script>

<SurveyScale {...$$restProps} preset="likert" hideLegend={hideLabel}>
  <svelte:fragment slot="legendChildren"
    ><slot name="labelChildren" /></svelte:fragment
  >
</SurveyScale>
