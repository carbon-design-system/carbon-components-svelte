<script lang="ts">
  import CopyInput from "carbon-components-svelte/CopyInput/CopyInput.svelte";
  import type { ComponentProps } from "svelte";

  export let value = "secret-token-123";
  export let type: ComponentProps<CopyInput>["type"] = "text";
  export let revealMode: ComponentProps<CopyInput>["revealMode"] = undefined;
  export let selectOnFocus: ComponentProps<CopyInput>["selectOnFocus"] =
    undefined;
  export let labelText = "API token";
  export let helperText = "";
  export let disabled = false;
  export let fluid = false;
  export let inline = false;
  export let id = "ccs-test";
</script>

<CopyInput
  {value}
  {type}
  {revealMode}
  {selectOnFocus}
  {labelText}
  {helperText}
  {disabled}
  {fluid}
  {inline}
  {id}
  on:copy={() => {
    console.log("copied");
  }}
/>
