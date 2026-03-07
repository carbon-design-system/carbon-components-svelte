<script>
  import { Checkbox } from "carbon-components-svelte";

  let checked = false;
</script>

<div class="fixture-container">
  <Checkbox
    data-testid="checkbox-agree"
    labelText="I agree to the terms"
    bind:checked
  />

  <Checkbox
    data-testid="checkbox-disabled"
    labelText="Disabled option"
    disabled={true}
  />
</div>

<style>
  .fixture-container {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
