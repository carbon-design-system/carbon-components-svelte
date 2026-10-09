<script lang="ts">
  import FormHelperText from "carbon-components-svelte/FormHelperText/FormHelperText.svelte";
  import FormItem from "carbon-components-svelte/FormItem/FormItem.svelte";
  import FormLabel from "carbon-components-svelte/FormLabel/FormLabel.svelte";
  import FormRequirement from "carbon-components-svelte/FormRequirement/FormRequirement.svelte";

  export let error = "";
</script>

<FormItem controlId="email" let:control let:controlId>
  <FormLabel>Email</FormLabel>
  <input id={controlId} use:control>
  <FormHelperText>Use your work email</FormHelperText>
  {#if error}
    <FormRequirement>{error}</FormRequirement>
  {/if}
</FormItem>
