<svelte:options accessors />

<script lang="ts">
  import QRCode from "carbon-components-svelte/QRCode/QRCode.svelte";
  import type { ComponentProps } from "svelte";

  export let value = "https://example.com";
  export let ecc: ComponentProps<QRCode>["ecc"] = undefined;
  export let alternative: ComponentProps<QRCode>["alternative"] = "copy";
  export let text: ComponentProps<QRCode>["text"] = undefined;
  export let logo = false;
  export let grouped = false;
  export let extra: Record<string, unknown> = {};
</script>

{#if logo}
  <QRCode {value} {ecc} {alternative} {text} {...extra} data-testid="qr">
    <span slot="logo" data-testid="logo">Logo</span>
  </QRCode>
{:else if grouped}
  <QRCode {value} {ecc} {alternative} {text} {...extra} data-testid="qr">
    <span slot="textAlternative" let:text>{text.toUpperCase()}</span>
  </QRCode>
{:else}
  <QRCode {value} {ecc} {alternative} {text} {...extra} data-testid="qr" />
{/if}
