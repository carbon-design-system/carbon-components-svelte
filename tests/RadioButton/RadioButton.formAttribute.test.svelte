<script lang="ts">
  import RadioButton from "carbon-components-svelte/RadioButton/RadioButton.svelte";
</script>

<form id="outer-form" data-testid="form"></form>
<RadioButton
  form="outer-form"
  name="plan"
  value="pro"
  checked
  labelText="Pro"
/>
