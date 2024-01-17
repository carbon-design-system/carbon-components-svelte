<script lang="ts">
  import { TextInput, TextInputSkeleton } from "../types";

  let value = null;
</script>

<TextInput
  labelText="User name"
  placeholder="Enter user name..."
  bind:value="{value}"
  on:input="{(e) => console.log(e)}"
  on:change="{(e) => (value = e)}"
  on:paste="{(e) => console.log(e)}"
  inputAttributes="{{ type: 'number' }}"
/>

<TextInput
  labelText="User name"
  helperText="Your user name is associated with your email"
  placeholder="Enter user name..."
/>

<TextInput
  labelText="Username"
  placeholder="Enter username..."
  maxCount="{32}"
  counter
/>

<TextInput hideLabel labelText="User name" placeholder="Enter user name..." />

<TextInput light labelText="User name" placeholder="Enter user name..." />

<TextInput inline labelText="User name" placeholder="Enter user name..." />

<TextInput size="lg" labelText="User name" placeholder="Enter user name..." />

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
