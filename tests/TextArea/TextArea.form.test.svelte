<script lang="ts">
  import TextArea from "carbon-components-svelte/TextArea/TextArea.svelte";

  export let value = "";
</script>

<form data-testid="form">
  <TextArea bind:value name="field" labelText="Notes" />
</form>
<p data-testid="bound">{value}</p>
