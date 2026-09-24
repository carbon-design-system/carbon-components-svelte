<script lang="ts">
  import RadioButton from "carbon-components-svelte/RadioButton/RadioButton.svelte";

  export let small = false;
  export let large = false;
</script>

<form data-testid="form">
  <RadioButton
    bind:checked={small}
    name="size"
    value="small"
    labelText="Small"
  />
  <RadioButton
    bind:checked={large}
    name="size"
    value="large"
    labelText="Large"
  />
</form>
<p data-testid="bound">{small}-{large}</p>
