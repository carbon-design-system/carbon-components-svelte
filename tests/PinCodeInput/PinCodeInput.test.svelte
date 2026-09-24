<svelte:options accessors />

<script lang="ts">
  import PinCodeInput from "carbon-components-svelte/PinCodeInput/PinCodeInput.svelte";
  import type { ComponentProps } from "svelte";

  export let count: ComponentProps<PinCodeInput>["count"] = 4;
  export let value: ComponentProps<PinCodeInput>["value"] = "";
  export let code: ComponentProps<PinCodeInput>["code"] = [];
  export let type: ComponentProps<PinCodeInput>["type"] = "numeric";
  export let pattern: ComponentProps<PinCodeInput>["pattern"] = undefined;
  export let mask: ComponentProps<PinCodeInput>["mask"] = false;
  export let uppercase: ComponentProps<PinCodeInput>["uppercase"] = false;
  export let complete: ComponentProps<PinCodeInput>["complete"] = false;
  export let disabled: ComponentProps<PinCodeInput>["disabled"] = false;
  export let readonly: ComponentProps<PinCodeInput>["readonly"] = false;
  export let loading: ComponentProps<PinCodeInput>["loading"] = false;
  export let loadingDescription: ComponentProps<PinCodeInput>["loadingDescription"] =
    "Verifying code";
  export let invalid: ComponentProps<PinCodeInput>["invalid"] = false;
  export let invalidText: ComponentProps<PinCodeInput>["invalidText"] = "";
  export let warn: ComponentProps<PinCodeInput>["warn"] = false;
  export let warnText: ComponentProps<PinCodeInput>["warnText"] = "";
  export let labelText: ComponentProps<PinCodeInput>["labelText"] =
    "Verification code";
  export let helperText: ComponentProps<PinCodeInput>["helperText"] = "";
  export let hideLabel: ComponentProps<PinCodeInput>["hideLabel"] = false;
  export let placeholder: ComponentProps<PinCodeInput>["placeholder"] =
    undefined;
  export let id: ComponentProps<PinCodeInput>["id"] = undefined;
  export let selectTextOnFocus: ComponentProps<PinCodeInput>["selectTextOnFocus"] = false;
  export let size: ComponentProps<PinCodeInput>["size"] = "default";
  export let fluid: ComponentProps<PinCodeInput>["fluid"] = false;
  export let name: ComponentProps<PinCodeInput>["name"] = undefined;
  export let required: ComponentProps<PinCodeInput>["required"] = false;
  export let segmentLabelText: ComponentProps<PinCodeInput>["segmentLabelText"] =
    undefined;
</script>

<PinCodeInput
  {count}
  bind:value
  bind:code
  bind:complete
  {size}
  {type}
  {pattern}
  {mask}
  {uppercase}
  {disabled}
  {readonly}
  {loading}
  {loadingDescription}
  {invalid}
  {invalidText}
  {warn}
  {warnText}
  {labelText}
  {helperText}
  {hideLabel}
  {placeholder}
  {id}
  {selectTextOnFocus}
  {fluid}
  {name}
  {required}
  {...segmentLabelText ? { segmentLabelText } : {}}
  on:change={(e) => console.log("change", e.detail)}
  on:complete={(e) => console.log("complete", e.detail)}
  on:clear={() => console.log("clear")}
  on:paste={(e) => console.log("paste", e.detail)}
/>
