<script>
  import QRCode from "carbon-components-svelte/QRCode/QRCode.svelte";
</script>

<QRCode
  value="otpauth://totp/Acme:alice?secret=JBSWY3DPEHPK3PXP&issuer=Acme"
  alternative="disclosure"
  {...$$restProps}
>
  <svg slot="logo" viewBox="0 0 8 8" width="100%" aria-hidden="true">
    <circle cx="4" cy="4" r="4" />
  </svg>
</QRCode>
