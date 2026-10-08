<script lang="ts">
  import Checkbox from "carbon-components-svelte/Checkbox/Checkbox.svelte";
</script>

<form id="outer-form" data-testid="form"></form>
<Checkbox
  form="outer-form"
  name="agree"
  value="yes"
  checked
  labelText="Agree"
/>
