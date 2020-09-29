<script>
  import { PasswordInput, TextInput } from "../TextInput";
  import FluidForm from "./FluidForm.svelte";

  $: value = null;
</script>

<FluidForm
  {...$$props}
  on:submit="{(event) => {
    console.log('on:submit', event);
  }}"
>
  <TextInput
    className="some-class"
    id="test2"
    labelText="Text Input label"
    placeholder="Placeholder text"
    bind:value
    on:keydown="{(e) => {
      console.log('on:keydown', e);
    }}"
    on:change="{() => {
      console.log('change');
    }}"
  />
  <PasswordInput
    required
    type="password"
    id="test4"
    labelText="Password"
    invalid
    invalidText="Your password must be at least 6 characters as well as contain at least one uppercase, one lowercase, and one number."
    on:keydown="{(e) => {
      console.log('on:keydown', e);
    }}"
  />
</FluidForm>
