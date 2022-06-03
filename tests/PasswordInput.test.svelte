<script lang="ts">
  import { PasswordInput } from "../types";
</script>

<PasswordInput labelText="Password" placeholder="Enter password..." />

<PasswordInput
  labelText="Password"
  type="text"
  placeholder="Enter password..."
  value="as_lta0890sdfpo__!9901"
  on:paste
/>

<PasswordInput hideLabel labelText="Password" placeholder="Enter password..." />

<PasswordInput light labelText="Password" placeholder="Enter password..." />

<PasswordInput size="xl" labelText="Password" placeholder="Enter password..." />

<PasswordInput size="sm" labelText="Password" placeholder="Enter password..." />

<PasswordInput
  invalid
  invalidText="Incorrect user name or password."
  labelText="Password"
  placeholder="Enter password..."
/>

<PasswordInput disabled labelText="Password" placeholder="Enter password..." />
