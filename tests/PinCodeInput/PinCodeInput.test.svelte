<svelte:options accessors />

<script lang="ts">
  import PinCodeInput from "carbon-components-svelte/PinCodeInput/PinCodeInput.svelte";
  import type { ComponentProps } from "svelte";

  export let count: ComponentProps<PinCodeInput>["count"] = 4;
  export let value: ComponentProps<PinCodeInput>["value"] = "";
  export let code: ComponentProps<PinCodeInput>["code"] = [];
  export let type: ComponentProps<PinCodeInput>["type"] = "numeric";
  export let mask: ComponentProps<PinCodeInput>["mask"] = false;
  export let uppercase: ComponentProps<PinCodeInput>["uppercase"] = false;
  export let complete: ComponentProps<PinCodeInput>["complete"] = false;
  export let disabled: ComponentProps<PinCodeInput>["disabled"] = false;
  export let readonly: ComponentProps<PinCodeInput>["readonly"] = false;
  export let invalid: ComponentProps<PinCodeInput>["invalid"] = false;
  export let invalidText: ComponentProps<PinCodeInput>["invalidText"] = "";
  export let warn: ComponentProps<PinCodeInput>["warn"] = false;
  export let warnText: ComponentProps<PinCodeInput>["warnText"] = "";
  export let labelText: ComponentProps<PinCodeInput>["labelText"] =
    "Verification code";
  export let helperText: ComponentProps<PinCodeInput>["helperText"] = "";
  export let id: ComponentProps<PinCodeInput>["id"] = undefined;
  export let selectTextOnFocus: ComponentProps<PinCodeInput>["selectTextOnFocus"] = false;
  export let size: ComponentProps<PinCodeInput>["size"] = "default";
</script>

<PinCodeInput
  {count}
  bind:value
  bind:code
  bind:complete
  {size}
  {type}
  {mask}
  {uppercase}
  {disabled}
  {readonly}
  {invalid}
  {invalidText}
  {warn}
  {warnText}
  {labelText}
  {helperText}
  {id}
  {selectTextOnFocus}
  on:change={(e) => console.log("change", e.detail)}
  on:complete={(e) => console.log("complete", e.detail)}
  on:clear={() => console.log("clear")}
  on:paste={(e) => console.log("paste", e.detail)}
/>
