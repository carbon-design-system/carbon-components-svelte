<script lang="ts">
  import Toggle from "carbon-components-svelte/Toggle/Toggle.svelte";
</script>

<form id="outer-form" data-testid="form"></form>
<Toggle form="outer-form" name="notify" toggled labelText="Notify" />
