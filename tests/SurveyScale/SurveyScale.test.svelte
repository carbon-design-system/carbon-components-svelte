<svelte:options accessors />

<script lang="ts">
  import SurveyScale from "carbon-components-svelte/SurveyScale/SurveyScale.svelte";

  export let value: number | string | undefined = undefined;
  export let changes: (number | string | null)[] = [];
</script>

<form data-testid="form">
  <SurveyScale
    bind:value
    legendText="How likely are you to recommend us?"
    {...$$restProps}
    on:change={(event) => (changes = [...changes, event.detail])}
  />
  <button type="reset">Reset</button>
</form>
<output data-testid="value">{value ?? "none"}</output>
