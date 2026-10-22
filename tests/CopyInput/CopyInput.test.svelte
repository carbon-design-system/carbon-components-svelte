<script lang="ts">
  import CopyInput from "carbon-components-svelte/CopyInput/CopyInput.svelte";
  import type { ComponentProps } from "svelte";

  export let value = "secret-token-123";
  export let type: ComponentProps<CopyInput>["type"] = "text";
  export let revealMode: ComponentProps<CopyInput>["revealMode"] = undefined;
  export let revealed: ComponentProps<CopyInput>["revealed"] = false;
  export let showValueLabel: ComponentProps<CopyInput>["showValueLabel"] =
    undefined;
  export let hideValueLabel: ComponentProps<CopyInput>["hideValueLabel"] =
    undefined;
  export let maskedValue: ComponentProps<CopyInput>["maskedValue"] = undefined;
  export let selectTextOnFocus: ComponentProps<CopyInput>["selectTextOnFocus"] =
    undefined;
  export let labelText = "API token";
  export let helperText = "";
  export let disabled = false;
  export let fluid = false;
  export let inline = false;
  export let id = "ccs-test";
  export let size: ComponentProps<CopyInput>["size"] = undefined;
  export let copy: ComponentProps<CopyInput>["copy"] = undefined;
  export let iconDescription = "Copy to clipboard";
  export let onCopy = () => {};
  export let onCopyError = (_detail: { error: unknown }) => {};
  export let onMouseEnterCopyButton = (_event: MouseEvent) => {};
  export let onMouseLeaveCopyButton = (_event: MouseEvent) => {};
</script>

<CopyInput
  {value}
  {type}
  {revealMode}
  bind:revealed
  {showValueLabel}
  {hideValueLabel}
  {maskedValue}
  {selectTextOnFocus}
  {labelText}
  {helperText}
  {disabled}
  {fluid}
  {inline}
  {id}
  {size}
  {copy}
  {iconDescription}
  on:copy={() => onCopy()}
  on:copy:error={(event) => onCopyError(event.detail)}
  on:mouseenter:copy-button={(event) => onMouseEnterCopyButton(event.detail)}
  on:mouseleave:copy-button={(event) => onMouseLeaveCopyButton(event.detail)}
/>
<p>Revealed: {revealed}</p>
