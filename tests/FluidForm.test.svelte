<script lang="ts">
  import { FluidForm, TextInput, PasswordInput } from "../types";
</script>

<FluidForm>
  <TextInput labelText="User name" placeholder="Enter user name..." required />
  <PasswordInput
    required
    type="password"
    labelText="Password"
    placeholder="Enter password..."
  />
</FluidForm>
