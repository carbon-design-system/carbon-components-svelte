<svelte:options accessors />

<script lang="ts">
  import FormHelperText from "carbon-components-svelte/FormHelperText/FormHelperText.svelte";
  import FormItem from "carbon-components-svelte/FormItem/FormItem.svelte";
  import FormLabel from "carbon-components-svelte/FormLabel/FormLabel.svelte";
  import FormRequirement from "carbon-components-svelte/FormRequirement/FormRequirement.svelte";

  export let error = "";
  export let warning = "";
</script>

<FormItem controlId="email" let:control let:invalid let:warn>
  <FormLabel>Email</FormLabel>
  <input use:control>
  <FormHelperText>Use your work email</FormHelperText>
  {#if error}
    <FormRequirement>{error}</FormRequirement>
  {/if}
  {#if warning}
    <FormRequirement kind="warn">{warning}</FormRequirement>
  {/if}
  <span data-testid="state">{invalid}:{warn}</span>
</FormItem>

<FormRequirement kind="warn" id="standalone">Standalone</FormRequirement>
