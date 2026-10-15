<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import InputGroup from "carbon-components-svelte/InputGroup/InputGroup.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import type { ComponentProps } from "svelte";

  export let labelText = "Promo code";
  export let hideLabel = false;
  export let helperText = "";
  export let invalid = false;
  export let invalidText = "";
  export let warn = false;
  export let warnText = "";
  export let size: ComponentProps<InputGroup>["size"] = undefined;
</script>

<InputGroup
  {labelText}
  {hideLabel}
  {helperText}
  {invalid}
  {invalidText}
  {warn}
  {warnText}
  {size}
  let:describedBy
  let:invalid={fieldInvalid}
>
  <TextInput
    hideLabel
    labelText="Code"
    aria-describedby={describedBy}
    invalid={fieldInvalid}
  />
  <Button kind="tertiary">Apply</Button>
</InputGroup>
