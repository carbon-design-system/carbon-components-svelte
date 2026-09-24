<script lang="ts">
  import PasswordInput from "carbon-components-svelte/TextInput/PasswordInput.svelte";

  export let value = "";
</script>

<form data-testid="form">
  <PasswordInput bind:value name="password" labelText="Password" />
</form>
<p data-testid="bound">{value}</p>
