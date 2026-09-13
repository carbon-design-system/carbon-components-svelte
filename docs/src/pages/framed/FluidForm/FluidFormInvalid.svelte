<script>
  import {
    FluidForm,
    PasswordInput,
    TextInput,
  } from "carbon-components-svelte";

  let password = "";
  let invalid = false;

  $: invalid = !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/.test(password);
</script>

<FluidForm>
  <TextInput
    labelText="Admin username"
    placeholder="Enter admin username..."
    required
  />
  <PasswordInput
    bind:value={password}
    {invalid}
    invalidText="Your password must be at least 6 characters and contain at least one uppercase letter, one lowercase letter, and one number."
    required
    type="password"
    labelText="Admin password"
    placeholder="Enter admin password..."
  />
</FluidForm>
