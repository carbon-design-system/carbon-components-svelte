<script lang="ts">
  import PasswordStrength from "carbon-components-svelte/PasswordStrength/PasswordStrength.svelte";
  import type { ComponentProps } from "svelte";

  export let value = "";
  export let userInputs: ComponentProps<PasswordStrength>["userInputs"] = [];
  export let estimate: ComponentProps<PasswordStrength>["estimate"] = undefined;
  export let estimateDelay = 0;
  export let showFeedback = true;
  export let labelText = "Password strength";
  export let hideLabel = false;
  export let levelTexts: ComponentProps<PasswordStrength>["levelTexts"] = {};
  export let feedbackTexts: ComponentProps<PasswordStrength>["feedbackTexts"] =
    {};
  export let valueText: ComponentProps<PasswordStrength>["valueText"] =
    undefined;
  export let size: ComponentProps<PasswordStrength>["size"] = "md";
  export let announceDelay = 1000;
  export let onchange: ((detail: unknown) => void) | undefined = undefined;
  export let onerror: ((detail: unknown) => void) | undefined = undefined;

  let strength: PasswordStrength;

  export function flush() {
    strength.flush();
  }
</script>

<PasswordStrength
  bind:this={strength}
  {value}
  {userInputs}
  {estimate}
  {estimateDelay}
  {showFeedback}
  {labelText}
  {hideLabel}
  {levelTexts}
  {feedbackTexts}
  {size}
  {announceDelay}
  {...valueText ? { valueText } : {}}
  data-testid="strength"
  on:change={(e) => onchange?.(e.detail)}
  on:error={(e) => onerror?.(e.detail)}
/>
