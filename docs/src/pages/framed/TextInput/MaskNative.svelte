<script>
  import { mask } from "carbon-components-svelte";

  let value = "";
</script>

<label class="bx--label" for="mask-native">Postal code</label>
<input
  id="mask-native"
  class="bx--text-input"
  autocomplete="postal-code"
  aria-describedby="mask-native-help"
  bind:value
  use:mask={{ pattern: "99999-9999" }}
/>
<div id="mask-native-help" class="bx--form__helper-text">
  Format: 55555-5555
</div>
