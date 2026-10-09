<script>
  import { preserveFocusSelection, Toggle } from "carbon-components-svelte";

  let selectTextOnFocus = true;
  let disabled = false;
  let value = "prod-us-east-1";
</script>

<Toggle bind:toggled={selectTextOnFocus} labelText="Select text on focus" />
<Toggle bind:toggled={disabled} labelText="Disabled" />

<label class="bx--label" for="cluster-name-toggle">Cluster name</label>
<input
  id="cluster-name-toggle"
  class="bx--text-input"
  bind:value
  {disabled}
  on:focus={(e) => {
    if (selectTextOnFocus) e.currentTarget.select();
  }}
  use:preserveFocusSelection={selectTextOnFocus && !disabled}
>
