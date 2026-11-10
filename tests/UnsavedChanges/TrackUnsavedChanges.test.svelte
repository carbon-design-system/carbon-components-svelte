<script lang="ts">
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";
  import FluidForm from "carbon-components-svelte/FluidForm/FluidForm.svelte";
  import Form from "carbon-components-svelte/Form/Form.svelte";
  import RadioButton from "carbon-components-svelte/RadioButton/RadioButton.svelte";
  import RadioButtonGroup from "carbon-components-svelte/RadioButtonGroup/RadioButtonGroup.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import { trackUnsavedChanges } from "carbon-components-svelte/UnsavedChanges/track-unsaved-changes.js";
  import type { TrackUnsavedChangesParams } from "carbon-components-svelte/UnsavedChanges/track-unsaved-changes.js";
  import type { UnsavedChangesStore } from "carbon-components-svelte/UnsavedChanges/unsaved-changes.js";
  import type { Action } from "svelte/action";

  export let store: UnsavedChangesStore;
  export let fluid = false;
  export let showExtra = false;
  export let tracked = true;

  let name = "Ada";
  let agree = false;
  let plan = "free";
  let extra = "";

  const actions: Array<
    [
      Action<HTMLFormElement, TrackUnsavedChangesParams>,
      TrackUnsavedChangesParams,
    ]
  > = [[trackUnsavedChanges, { store }]];
  const form = fluid ? FluidForm : Form;
</script>

<svelte:component
  this={form}
  data-testid="form"
  actions={tracked ? actions : []}
  on:submit
>
  <!-- No `name`: `FormData` would skip every control here. -->
  <TextInput labelText="Name" bind:value={name} />
  <Checkbox labelText="Agree" bind:checked={agree} />
  <RadioButtonGroup legendText="Plan" bind:selected={plan}>
    <RadioButton labelText="Free" value="free" />
    <RadioButton labelText="Pro" value="pro" />
  </RadioButtonGroup>
  {#if showExtra}
    <TextInput labelText="Extra" bind:value={extra} />
  {/if}
  <button type="submit">Save</button>
  <button type="reset">Reset</button>
</svelte:component>
