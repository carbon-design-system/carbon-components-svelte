<script>
  import { PasswordInput } from "carbon-components-svelte";

  let value = "";
</script>

<div class="fixture-container">
  <PasswordInput
    data-testid="password-input"
    labelText="Password"
    placeholder="Enter password"
    bind:value
  />
</div>

<style>
  .fixture-container {
    padding: 2rem;
  }
</style>
