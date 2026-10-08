<script lang="ts">
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import type { ComponentProps } from "svelte";

  export let invalid: ComponentProps<TextInput>["invalid"] = false;
  export let invalidText: ComponentProps<TextInput>["invalidText"] = "";
</script>

<form data-testid="form">
  <TextInput required labelText="User" {invalid} {invalidText} />
</form>
