<script lang="ts">
  import { CopyInput } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let value = "secret-token-123";
  export let type: ComponentProps<CopyInput>["type"] = "text";
  export let selectOnFocus: ComponentProps<CopyInput>["selectOnFocus"] =
    undefined;
  export let labelText = "API token";
  export let helperText = "";
  export let disabled = false;
  export let id = "ccs-test";
</script>

<CopyInput
  {value}
  {type}
  selectOnFocus={selectOnFocus ?? true}
  {labelText}
  {helperText}
  {disabled}
  {id}
  on:copy={() => {
    console.log("copied");
  }}
/>
