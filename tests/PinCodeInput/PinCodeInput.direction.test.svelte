<script lang="ts">
  import LayoutDirection from "carbon-components-svelte/LayoutDirection/LayoutDirection.svelte";
  import PinCodeInput from "carbon-components-svelte/PinCodeInput/PinCodeInput.svelte";

  export let dir: "ltr" | "rtl" | undefined = undefined;
</script>

<LayoutDirection dir="rtl">
  <PinCodeInput labelText="Verification code" {dir} />
</LayoutDirection>
