<script context="module">
  // DEMO ONLY: nothing in this block ships with the library. A real server
  // owns the secret, checks the code, counts failed attempts, and stores the
  // recovery codes hashed. Here the browser plays both sides so the flow runs
  // on a static docs page.

  const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  // No 0, 1, i, l or o, so a code read aloud or copied by hand is not misread.
  const RECOVERY_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

  export function base32Encode(bytes) {
    let out = "";
    let bits = 0;
    let value = 0;
    for (const byte of bytes) {
      value = (value << 8) | byte;
      bits += 8;
      while (bits >= 5) {
        out += BASE32[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
      value &= (1 << bits) - 1;
    }
    return bits > 0 ? out + BASE32[(value << (5 - bits)) & 31] : out;
  }

  export function base32Decode(text) {
    const clean = text.toUpperCase().replace(/[\s=-]/g, "");
    const out = [];
    let bits = 0;
    let value = 0;
    for (const char of clean) {
      const index = BASE32.indexOf(char);
      if (index < 0) throw new Error(`Not a base32 character: ${char}`);
      value = (value << 5) | index;
      bits += 5;
      if (bits >= 8) {
        out.push((value >>> (bits - 8)) & 255);
        bits -= 8;
        value &= (1 << bits) - 1;
      }
    }
    return new Uint8Array(out);
  }

  // RFC 4226 HOTP with HMAC-SHA-1, which RFC 6238 builds TOTP on.
  export async function hotp(key, counter, digits = 6) {
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      new Uint8Array(key),
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"],
    );
    const message = new DataView(new ArrayBuffer(8));
    message.setUint32(0, Math.floor(counter / 2 ** 32));
    message.setUint32(4, counter >>> 0);
    const mac = new Uint8Array(
      await crypto.subtle.sign("HMAC", cryptoKey, message),
    );
    const offset = mac[19] & 15;
    const binary =
      ((mac[offset] & 127) << 24) |
      (mac[offset + 1] << 16) |
      (mac[offset + 2] << 8) |
      mac[offset + 3];
    return String(binary % 10 ** digits).padStart(digits, "0");
  }

  // RFC 6238 TOTP: HOTP over the number of 30-second steps since the epoch.
  export function totp(key, time = Date.now(), digits = 6, period = 30) {
    return hotp(key, Math.floor(time / 1000 / period), digits);
  }

  /**
   * Check a code the way a server would. `"expired"` means it was right a
   * few steps ago, so the message can say so instead of calling it wrong.
   * Accept one step either way for clock drift, and in a real server also
   * refuse a step that was already used.
   */
  export async function checkTotp(key, code, time = Date.now(), period = 30) {
    // The current step and one either side, then the steps just before.
    const steps = [0, -1, 1, -2, -3, -4, -5];
    const codes = await Promise.all(
      steps.map((step) => totp(key, time + step * period * 1000)),
    );
    const found = codes.indexOf(code);
    if (found < 0) return "wrong";
    return found < 3 ? "ok" : "expired";
  }

  export function recoveryCodes(count = 10) {
    return Array.from({ length: count }, () => {
      const chars = [];
      while (chars.length < 10) {
        for (const byte of crypto.getRandomValues(new Uint8Array(16))) {
          // 248 is the largest multiple of 31 below 256: rejecting the rest
          // keeps every character equally likely.
          if (byte < 248 && chars.length < 10) {
            chars.push(RECOVERY_ALPHABET[byte % 31]);
          }
        }
      }
      return `${chars.slice(0, 5).join("")}-${chars.slice(5).join("")}`;
    });
  }
</script>

<script>
  import {
    Button,
    Checkbox,
    CodeSnippet,
    Countdown,
    InlineNotification,
    PinCodeInput,
    QRCode,
    Stack,
    Stepper,
  } from "carbon-components-svelte";
  import Download from "carbon-icons-svelte/lib/Download.svelte";
  import Printer from "carbon-icons-svelte/lib/Printer.svelte";
  import { onMount, tick } from "svelte";

  export let issuer = "Acme";
  export let account = "alice@acme.io";
  // Failed codes allowed before the server locks the step, and for how long.
  export let maxAttempts = 5;
  export let lockSeconds = 30;

  let currentIndex = 0;
  let submitted = false;
  let secret = null;
  let key = "";
  let uri = "";
  let code = "";
  let complete = false;
  let pin;
  let invalid = false;
  let invalidText = "";
  let failures = 0;
  let lockedUntil = 0;
  let codes = [];
  let saved = false;

  // The server hands the client a fresh secret. Doing it on mount keeps the
  // server-rendered page free of a random value.
  function enroll() {
    secret = crypto.getRandomValues(new Uint8Array(20));
    key = base32Encode(secret);
    // The label is `Issuer:account`, and the issuer repeats as a parameter.
    uri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${key}&issuer=${encodeURIComponent(issuer)}`;
  }
  onMount(enroll);

  $: groupedKey = key.replace(/(.{4})(?=.)/g, "$1 ");
  $: locked = lockedUntil > 0;
  $: nextDisabled =
    (currentIndex === 1 && locked) || (currentIndex === 2 && !saved);

  // Typing again clears the last error.
  function change() {
    if (!locked) invalid = false;
  }

  // DEMO ONLY: the request the server answers.
  async function verifyOnServer(value) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (locked) return "locked";
    const result = await checkTotp(secret, value);
    if (result === "ok") {
      failures = 0;
      return "ok";
    }
    failures += 1;
    if (failures >= maxAttempts) {
      failures = 0;
      lockedUntil = Date.now() + lockSeconds * 1000;
      return "locked";
    }
    return result;
  }

  async function validate(index) {
    if (index !== 1) return true;
    if (!complete) {
      invalid = true;
      invalidText = "Enter all six digits.";
      return false;
    }
    const result = await verifyOnServer(code);
    if (result === "ok") {
      invalid = false;
      codes = recoveryCodes();
      return true;
    }
    invalidText = {
      wrong: "That code is not right. Check your app and try again.",
      expired: "That code has expired. Enter the code your app shows now.",
      locked: "Too many attempts. Wait before you try again.",
    }[result];
    // Clear the wrong digits and put the cursor back on the first one.
    // Stepper moves focus to the invalid field once this returns.
    pin.clear({ focus: true });
    invalid = true;
    return false;
  }

  async function unlock() {
    lockedUntil = 0;
    invalid = false;
    // The segments are enabled on the next tick.
    await tick();
    pin?.focusFirstInput();
  }

  const recoveryText = () =>
    [
      `${issuer} recovery codes for ${account}`,
      "",
      "Each code works once. Keep them somewhere only you can reach.",
      "",
      ...codes,
      "",
    ].join("\n");

  function download() {
    const url = URL.createObjectURL(
      new Blob([recoveryText()], { type: "text/plain" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${issuer.toLowerCase()}-recovery-codes.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Print from a hidden frame, so the page around the codes stays out of it.
  function print() {
    const frame = document.createElement("iframe");
    frame.title = "Recovery codes";
    frame.style.cssText =
      "position:fixed;inset-inline-end:0;inset-block-end:0;inline-size:0;block-size:0;border:0";
    document.body.append(frame);
    const sheet = frame.contentDocument;
    const text = sheet.createElement("pre");
    text.textContent = recoveryText();
    text.style.fontSize = "16px";
    sheet.body.append(text);
    frame.contentWindow.addEventListener("afterprint", () => frame.remove());
    frame.contentWindow.print();
  }

  // DEMO ONLY: the request that turns two-factor authentication on.
  async function turnOn() {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  function restart() {
    code = "";
    saved = false;
    codes = [];
    invalid = false;
    failures = 0;
    lockedUntil = 0;
    currentIndex = 0;
    submitted = false;
    enroll();
  }
</script>

<Stepper
  steps={["Scan", "Verify", "Save codes"]}
  bind:currentIndex
  bind:submitted
  {validate}
  {nextDisabled}
  submit={turnOn}
  submitText="Turn on"
  validatingDescription="Checking the code"
  submittingDescription="Turning on two-factor authentication"
  let:currentIndex={step}
  let:submitted={done}
>
  {#if done}
    <Stack gap={5}>
      <InlineNotification
        lowContrast
        hideCloseButton
        kind="success"
        title="Two-factor authentication is on."
        subtitle="Next time you sign in, {issuer} asks for a code from your app."
      />
      <div>
        <Button kind="tertiary" on:click={restart}>Start again</Button>
      </div>
    </Stack>
  {:else if step === 0}
    <Stack gap={6}>
      <p>
        Scan this code with an authenticator app, such as 1Password or Google
        Authenticator. It adds {account} to the app.
      </p>
      {#if uri}
        <QRCode
          value={uri}
          text={key}
          alternative="disclosure"
          alternativeLabel="Can't scan? Enter this key"
          labelText="Scan to set up two-factor authentication for {account}"
        >
          <span slot="textAlternative">{groupedKey}</span>
        </QRCode>
      {/if}
    </Stack>
  {:else if step === 1}
    <Stack gap={5}>
      <PinCodeInput
        bind:this={pin}
        bind:value={code}
        bind:complete
        count={6}
        labelText="6-digit code"
        helperText="The code in your app changes every 30 seconds."
        disabled={locked}
        {invalid}
        {invalidText}
        on:change={change}
      />
      {#if locked}
        <InlineNotification
          lowContrast
          hideCloseButton
          kind="error"
          title="Too many attempts."
        >
          Try again in{" "}<Countdown
            until={lockedUntil}
            seconds={lockSeconds}
            format="m:ss"
            on:end={unlock}
          />
        </InlineNotification>
      {/if}
    </Stack>
  {:else}
    <Stack gap={5}>
      <p>
        Save these recovery codes. Each one signs you in once if you lose your
        phone. They are shown only now.
      </p>
      <CodeSnippet
        type="multi"
        code={codes.join("\n")}
        copyButtonDescription="Copy recovery codes"
        feedback="Copied"
      />
      <Stack orientation="horizontal" gap={3}>
        <Button
          kind="tertiary"
          size="small"
          icon={Download}
          on:click={download}
        >
          Download .txt
        </Button>
        <Button kind="tertiary" size="small" icon={Printer} on:click={print}>
          Print
        </Button>
      </Stack>
      <Checkbox bind:checked={saved} labelText="I saved these recovery codes" />
    </Stack>
  {/if}
</Stepper>
