<script>
  import { CopyButton } from "carbon-components-svelte";
</script>

<CopyButton
  text="https://api.acme.io/webhooks/incoming/f8a2c91d"
  copy={(text) => navigator.clipboard.writeText(text)}
  tooltipAlignment="start"
/>
