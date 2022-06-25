<script>
  import {
    FluidForm,
    TextInput,
    PasswordInput,
  } from "carbon-components-svelte";

  let password = "";
  let invalid = false;

  $: invalid = !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/.test(password);
</script>

<FluidForm>
  <TextInput labelText="User name" placeholder="Enter user name..." required />
  <PasswordInput
    bind:value="{password}"
    invalid="{invalid}"
    invalidText="Your password must be at least 6 characters as well as contain at least one uppercase, one lowercase, and one number."
    required
    type="password"
    labelText="Password"
    placeholder="Enter password..."
  />
</FluidForm>
