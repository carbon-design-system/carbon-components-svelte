<script>
  import { TextInput } from "carbon-components-svelte";

  let value = "";
</script>

<div class="fixture-container">
  <TextInput
    data-testid="text-input-username"
    labelText="User name"
    placeholder="Enter your name"
    bind:value
  />

  <TextInput
    data-testid="text-input-disabled"
    labelText="Disabled field"
    placeholder="Cannot edit"
    disabled={true}
  />

  <TextInput
    data-testid="text-input-invalid"
    labelText="Invalid field"
    placeholder="Has error"
    invalid={true}
    invalidText="This field is required"
  />
</div>

<style>
  .fixture-container {
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
</style>
