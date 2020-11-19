<script lang="ts">
  import { TextInput, TextInputSkeleton } from "../types";
</script>

<TextInput labelText="User name" placeholder="Enter user name..." />

<TextInput
  labelText="User name"
  helperText="Your user name is associated with your email"
  placeholder="Enter user name..."
/>

<TextInput hideLabel labelText="User name" placeholder="Enter user name..." />

<TextInput light labelText="User name" placeholder="Enter user name..." />

<TextInput inline labelText="User name" placeholder="Enter user name..." />

<TextInput size="xl" labelText="User name" placeholder="Enter user name..." />

<TextInput size="sm" labelText="User name" placeholder="Enter user name..." />

<TextInput
  invalid
  invalidText="User name is already taken. Please try another."
  labelText="User name"
  placeholder="Enter user name..."
/>

<TextInput disabled labelText="User name" placeholder="Enter user name..." />

<TextInputSkeleton />

<TextInputSkeleton hideLabel />
