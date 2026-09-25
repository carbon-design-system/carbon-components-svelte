<script lang="ts">
  import RadioButton from "carbon-components-svelte/RadioButton/RadioButton.svelte";

  export let checked = true;
</script>

<form data-testid="form">
  <RadioButton
    bind:checked
    readonly
    name="readonly-size"
    value="readonly"
    labelText="Readonly"
  />
</form>
<p data-testid="bound">{checked}</p>
