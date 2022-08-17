<script>
  import { TextInput } from "carbon-components-svelte";

  export let value;
</script>

<TextInput style="margin-bottom: 1rem;" bind:value {...$$restProps} />
