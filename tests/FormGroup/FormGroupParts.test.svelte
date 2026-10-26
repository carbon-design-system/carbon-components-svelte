<svelte:options accessors />

<script lang="ts">
  import FormGroup from "carbon-components-svelte/FormGroup/FormGroup.svelte";
  import FormHelperText from "carbon-components-svelte/FormHelperText/FormHelperText.svelte";
  import FormItem from "carbon-components-svelte/FormItem/FormItem.svelte";
  import FormLabel from "carbon-components-svelte/FormLabel/FormLabel.svelte";
  import FormRequirement from "carbon-components-svelte/FormRequirement/FormRequirement.svelte";

  export let error = "";
  export let message = false;
  export let disabled = false;
  export let id = "contact";
</script>

<FormGroup
  {id}
  legendText="Contact"
  {message}
  {disabled}
  messageText="Group note"
>
  <input type="checkbox" aria-label="Email" />
  <FormHelperText>Pick at least one</FormHelperText>
  {#if error}
    <FormRequirement>{error}</FormRequirement>
  {/if}
  <FormLabel>Loose label</FormLabel>
  <FormItem controlId="phone" let:control>
    <FormLabel>Phone</FormLabel>
    <input use:control />
    <FormHelperText>Mobile only</FormHelperText>
  </FormItem>
</FormGroup>
