<script>
  import { QRCode, Stack } from "carbon-components-svelte";
  import Locked from "carbon-icons-svelte/lib/Locked.svelte";

  const OTP =
    "otpauth://totp/Acme:alice@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Acme";
</script>

<Stack gap={7}>
  <QRCode
    data-testid="qr-default"
    value="https://example.com/devices/pair?code=482913"
    labelText="Scan to pair this device"
  />

  <QRCode
    data-testid="qr-disclosure"
    value={OTP}
    text="JBSWY3DPEHPK3PXP"
    alternative="disclosure"
    alternativeLabel="Can't scan? Enter this key"
    labelText="Scan to set up two-factor authentication"
  >
    <span slot="textAlternative" let:text
      >{text.replace(/(.{4})(?=.)/g, "$1 ")}</span
    >
  </QRCode>

  <QRCode
    data-testid="qr-logo"
    value={OTP}
    text="JBSWY3DPEHPK3PXP"
    size={240}
    labelText="Scan to sign in with a security key"
  >
    <Locked slot="logo" size={32} />
  </QRCode>

  <QRCode
    data-testid="qr-emoji"
    value="WIFI:T:WPA;S:Café ☕ 你好;P:pässwörd;;"
    ecc="Q"
    labelText="Scan to join the Wi-Fi network"
  />

  <div style="inline-size: 120px">
    <QRCode
      data-testid="qr-narrow"
      value="https://example.com/narrow"
      size={240}
      labelText="Scan to open the page"
      alternative="none"
    />
  </div>
  <p>Link: https://example.com/narrow</p>
</Stack>
