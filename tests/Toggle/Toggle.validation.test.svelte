<script lang="ts">
  import Toggle from "carbon-components-svelte/Toggle/Toggle.svelte";

  export let warn = false;
  export let warnText = "Warning toggle";
  export let disabled = false;
  export let readonly = false;
</script>

<Toggle {warn} {warnText} {disabled} {readonly} labelText="Validation toggle" />
