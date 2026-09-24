<script lang="ts">
  import TimePicker from "carbon-components-svelte/TimePicker/TimePicker.svelte";

  export let value = "";
  export let fluid = false;
</script>

<form data-testid="form">
  <TimePicker bind:value {fluid} name="time" labelText="Time" />
</form>
<p data-testid="bound">{value}</p>
