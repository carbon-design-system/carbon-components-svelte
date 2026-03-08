<script>
  import { PasswordInput } from "carbon-components-svelte";

  let value = "";
</script>

<PasswordInput
  data-testid="password-input"
  labelText="Password"
  placeholder="Enter password"
  bind:value
/>
