<svelte:options accessors />

<script lang="ts">
  import RadioButton from "carbon-components-svelte/RadioButton/RadioButton.svelte";

  export let checked1 = false;
  export let checked2 = false;
  export let checked3 = false;
  export let groupName = "implicit-group";
  export let secondGroupName: string | undefined = undefined;
  export let checked4 = false;
  export let checked5 = false;
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

{#if secondGroupName}
  <div>
    <RadioButton
      bind:checked={checked4}
      value="option4"
      labelText="Option 4"
      name={secondGroupName}
    />
  </div>

  <div>
    <RadioButton
      bind:checked={checked5}
      value="option5"
      labelText="Option 5"
      name={secondGroupName}
    />
  </div>
{/if}
