<svelte:options accessors />

<script lang="ts">
  import { RadioButton } from "carbon-components-svelte";

  export let checked1 = false;
  export let checked2 = false;
  export let checked3 = false;
  export let groupName = "implicit-group";
</script>

<!-- Implicit group via shared name attribute -->
<div>
  <RadioButton
    bind:checked={checked1}
    value="option1"
    labelText="Option 1"
    name={groupName}
  />
</div>

<div>
  <RadioButton
    bind:checked={checked2}
    value="option2"
    labelText="Option 2"
    name={groupName}
  />
</div>

<div>
  <RadioButton
    bind:checked={checked3}
    value="option3"
    labelText="Option 3"
    name={groupName}
  />
</div>
