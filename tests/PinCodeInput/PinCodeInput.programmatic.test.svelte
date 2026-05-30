<script lang="ts">
  import PinCodeInput from "carbon-components-svelte/PinCodeInput/PinCodeInput.svelte";
  import type { ComponentProps } from "svelte";

  export let value: ComponentProps<PinCodeInput>["value"] = "018";
  export let selectTextOnFocus: ComponentProps<PinCodeInput>["selectTextOnFocus"] = false;

  let pinCodeInput: PinCodeInput;
</script>

<PinCodeInput
  bind:this={pinCodeInput}
  bind:value
  {selectTextOnFocus}
  labelText="Verification code"
  on:change={(e) => console.log("change", e.detail)}
  on:clear={() => console.log("clear")}
/>

<div data-testid="value">{value}</div>

<button
  type="button"
  data-testid="focus-first"
  on:click={() => pinCodeInput.focusFirstInput()}
>
  Focus first
</button>
<button
  type="button"
  data-testid="focus-last"
  on:click={() => pinCodeInput.focusLastInput()}
>
  Focus last
</button>
<button
  type="button"
  data-testid="focus-next-empty"
  on:click={() => pinCodeInput.focusNextEmptyInput()}
>
  Focus next empty
</button>
<button
  type="button"
  data-testid="focus-next"
  on:click={() => pinCodeInput.focusNext()}
>
  Focus next
</button>
<button
  type="button"
  data-testid="focus-next-select"
  on:click={() => pinCodeInput.focusNext({ selectTextOnFocus: true })}
>
  Focus next (select)
</button>
<button
  type="button"
  data-testid="focus-first-select"
  on:click={() => pinCodeInput.focusFirstInput({ selectTextOnFocus: true })}
>
  Focus first (select)
</button>
<button
  type="button"
  data-testid="focus-first-no-select"
  on:click={() => pinCodeInput.focusFirstInput({ selectTextOnFocus: false })}
>
  Focus first (no select)
</button>
<button type="button" data-testid="clear" on:click={() => pinCodeInput.clear()}>
  Clear
</button>
<button
  type="button"
  data-testid="clear-focus"
  on:click={() => pinCodeInput.clear({ focus: true })}
>
  Clear (focus)
</button>
