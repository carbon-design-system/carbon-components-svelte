<script>
  import { CopyButton } from "carbon-components-svelte";
  import copy from "clipboard-copy";
</script>

<CopyButton
  text="https://api.acme.io/webhooks/incoming/f8a2c91d"
  copy={(text) => copy(text)}
  tooltipAlignment="start"
/>
