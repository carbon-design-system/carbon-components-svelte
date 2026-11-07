<svelte:options accessors />

<script lang="ts">
  import LikertMatrix from "carbon-components-svelte/SurveyScale/LikertMatrix.svelte";

  export let value: Record<string, string | number> = {};
  export let changes: { id: string; value: string | number }[] = [];
</script>

<form data-testid="form">
  <LikertMatrix
    bind:value
    legendText="Setting up"
    statements={[
      { id: "quick", text: "Creating my account was quick." },
      { id: "team", text: "Inviting my team was easy." },
    ]}
    {...$$restProps}
    on:change={(event) => (changes = [...changes, event.detail])}
  />
  <button type="reset">Reset</button>
</form>
<output data-testid="value">{JSON.stringify(value)}</output>
