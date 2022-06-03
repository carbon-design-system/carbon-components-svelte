<script lang="ts">
  import { TextInput, TextInputSkeleton } from "../types";

  let value = null;
</script>

<TextInput
  type="number"
  labelText="User name"
  placeholder="Enter user name..."
  bind:value
  on:input="{(e) => console.log(e.detail)}"
  on:change="{(e) => (value = e.detail)}"
  on:paste="{(e) => console.log(e)}"
/>

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
