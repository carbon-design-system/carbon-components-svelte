<script lang="ts">
  import PinCodeInput from "carbon-components-svelte/PinCodeInput/PinCodeInput.svelte";

  export let value = "1234";
  export let required = false;
</script>

<form id="outer-form" data-testid="form"></form>
<PinCodeInput
  form="outer-form"
  name="otp"
  labelText="Code"
  {value}
  {required}
/>
