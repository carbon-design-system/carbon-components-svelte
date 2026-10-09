<svelte:options accessors />

<script lang="ts">
  import FormHelperText from "carbon-components-svelte/FormHelperText/FormHelperText.svelte";
  import FormItem from "carbon-components-svelte/FormItem/FormItem.svelte";
  import FormLabel from "carbon-components-svelte/FormLabel/FormLabel.svelte";

  export let showHelper = true;
  export let disabled = false;
</script>

<FormItem controlId="email" {disabled} let:control let:describedBy>
  <FormLabel>Email</FormLabel>
  <input use:control>
  {#if showHelper}
    <FormHelperText>Use your work email</FormHelperText>
  {/if}
  <span data-testid="described-by">{describedBy ?? ""}</span>
</FormItem>

<FormHelperText id="standalone" class="custom">Standalone</FormHelperText>
