<script lang="ts">
  import ListBoxRequiredInput from "carbon-components-svelte/ListBox/ListBoxRequiredInput.svelte";
  import type { ComponentProps } from "svelte";

  export let hasValue: ComponentProps<ListBoxRequiredInput>["hasValue"] = false;
  export let disabled: ComponentProps<ListBoxRequiredInput>["disabled"] = false;
  export let readonly: ComponentProps<ListBoxRequiredInput>["readonly"] = false;
  export let onsubmit: ((event: SubmitEvent) => void) | undefined = undefined;
</script>

<form
  data-testid="form"
  on:submit|preventDefault={(event) => onsubmit?.(event)}
>
  <ListBoxRequiredInput {hasValue} {disabled} {readonly} />
</form>
