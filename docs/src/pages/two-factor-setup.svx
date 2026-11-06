---
title: Two-factor setup
layout: guide
description: A recipe for enrolling a user in authenticator-app two-factor authentication: scan a QR code or type the key, confirm a six-digit code, and save recovery codes.
---

## Try it

The flow is a [Stepper](/components/Stepper) with three steps. It uses a [QRCode](/components/QRCode) for the key, a [PinCodeInput](/components/PinCodeInput) for the code, and a [CodeSnippet](/components/CodeSnippet) for the recovery codes. Scan the code with a real authenticator app, or open "Can't scan? Enter this key" and add the key by hand. The app's six digits will pass.

<FileSource src="/framed/TwoFactorSetup/TwoFactorSetup" />

The top of the example is a stand-in for your server, and nothing in it ships with the library. It generates the secret, checks the code with TOTP (RFC 6238) through `crypto.subtle`, counts failed attempts, and makes the recovery codes in the browser, so the flow runs on a static page. Replace each with a call to your own back end.

## A recipe, not a component

Carbon Components Svelte gives you the parts: `QRCode`, `PinCodeInput`, `Stepper`, `CodeSnippet`. It doesn't ship a `TwoFactorSetup` component. The parts are the same for every product, but the flow around them is not, so a recipe you copy and edit fits better than a component with props for each difference.

| What varies | Why it stays in your code |
| --- | --- |
| Where the secret comes from and how the code is checked | Verification has to happen on the server, where the secret lives. A component can only call back into your code. |
| How many recovery codes, their format, and how long they live | These follow your security policy, and the server stores only a hash of each. |
| Other factors, such as SMS or a security key | The steps, the copy, and the order change. |
| The product name, the account label, and what follows a successful setup | They come from the app. |

## Steps

### Scan

The code encodes an `otpauth://` URI, which an authenticator app reads. The URI has the label `Issuer:account`, the base32 `secret`, and the `issuer` again as a parameter.

```text
otpauth://totp/Acme:alice@acme.io?secret=JBSWY3DPEHPK3PXP&issuer=Acme
```

The key under "Can't scan? Enter this key" is the same secret, in groups of four letters so it is easy to read and type. The copy button copies it without the spaces. `QRCode` points the image at that text with `aria-describedby`, so a screen reader hears the key from the image, and a person on a laptop with no phone can still finish.

### Verify

`PinCodeInput` collects six digits. Its first segment has `autocomplete="one-time-code"`, so a phone offers the code from a text message, and a pasted code fills every segment. Continue sends the digits to the server.

### Save codes

The server makes the recovery codes only after the code checks out. The step shows them in a `CodeSnippet`, which copies them, and offers a `.txt` download and a print sheet. "I saved these recovery codes" must be checked before the last button turns on two-factor authentication, so nobody finishes without having a copy.

## Errors

Every error keeps the focus where the next try starts.

| Case | What the user sees | What the code does |
| --- | --- | --- |
| Wrong code | "That code is not right. Check your app and try again." | Clears the digits and focuses the first segment. Typing again clears the message. |
| Expired code | "That code has expired. Enter the code your app shows now." | Same. The server tells an old code from a wrong one by checking the last few steps. |
| Too many attempts | An error notification with a countdown, and the segments disabled | Disables Continue until the [Countdown](/components/Countdown) ends, then enables the segments and focuses the first one. |
| Incomplete code | "Enter all six digits." | Focuses the first segment. |

`validate` on `Stepper` returns `false` for each of these, so the step stays and Continue shows its loading state while the request runs.

## The server's part

| Do | Why |
| --- | --- |
| Check the code on the server, with a constant-time comparison. | Anything the browser checks, an attacker can skip. |
| Accept the current 30-second step and one on either side, and refuse a step that was already used. | The window covers clock drift. Refusing a used step stops a code shoulder-surfed or intercepted from being replayed. |
| Limit failed attempts per account, with a longer lock each time. | Six digits are only a million guesses. The countdown in this example is the user's side of that limit. |
| Show the recovery codes once, and store only a hash of each. | A leaked database should not hand out working codes. |
| Keep the secret out of logs and URLs, and show it only during setup. | The secret is the second factor. Anyone who has it can make the codes. |
| Turn two-factor authentication on only after the code checks out. | A secret that was never confirmed can lock the user out. |

## TOTP in the example

RFC 6238 builds TOTP on HOTP (RFC 4226): the HMAC-SHA-1 of the number of 30-second steps since the epoch, cut down to six digits. Browsers do the HMAC with `crypto.subtle`.

```js
async function hotp(key, counter, digits = 6) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-1" }, false, ["sign"],
  );
  const message = new DataView(new ArrayBuffer(8));
  message.setUint32(0, Math.floor(counter / 2 ** 32));
  message.setUint32(4, counter >>> 0);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, message));
  const offset = mac[19] & 15;
  const binary =
    ((mac[offset] & 127) << 24) | (mac[offset + 1] << 16) |
    (mac[offset + 2] << 8) | mac[offset + 3];
  return String(binary % 10 ** digits).padStart(digits, "0");
}
```

Run that on your server with your platform's HMAC, not in the page: in a page, the user can read the secret and the code. The example passes the test vectors of both RFCs.
