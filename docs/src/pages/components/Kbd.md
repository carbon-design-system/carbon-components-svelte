---
description: Kbd shows a key, or the keys of a keyboard shortcut, as key caps, with the platform's modifier keys and names a screen reader can read.
---

<script>
  import { Kbd, Stack, Text } from "carbon-components-svelte";
</script>

## Basic

Set `shortcut` to the keys joined by `+`. `mod` is Command on Apple platforms and Ctrl elsewhere, so one shortcut reads right on both: ⌘ K on a Mac, Ctrl K on Windows and Linux. Modifiers show in the platform's order, and screen readers hear the key names ("Command K"), not the symbols.

<Stack orientation="horizontal" gap={5} align="center">
  <Kbd shortcut="mod+k" />
  <Kbd shortcut="mod+shift+p" />
  <Kbd shortcut="alt+arrowleft" />
  <Kbd shortcut="escape" />
</Stack>

## Platform

The server can't tell the platform, so a `Kbd` renders both sets of keys in one place, as wide as the wider set, and shows the Windows and Linux keys until it mounts; on a Mac, every `Kbd` then switches to Apple's symbols together, without moving the layout. To show the right keys from the first paint, at their own width, inline `platformScript` as a script in `<head>`: it marks `<html>` with the platform before the page renders.

```js
import { platformScript } from "carbon-components-svelte";

const script = `<script>${platformScript()}</script>`;
```

A Content Security Policy that blocks inline scripts also blocks this one. Add a nonce to the tag and the policy, or allow the script's hash in `script-src`.

Set `apple` to choose the platform yourself, such as from the request's user agent on the server.

<Stack orientation="horizontal" gap={5} align="center">
  <Kbd shortcut="mod+shift+s" apple />
  <Kbd shortcut="mod+shift+s" apple={false} />
</Stack>

## One key

Without a `shortcut`, the default slot is shown as one key, for a key the shortcut syntax doesn't name.

<Kbd>Fn</Kbd>

## Sizes

Set `size` to control key height. The default is `"default"`, 24px tall. Use `"sm"`, 20px, for keys in a 32px or 40px control.

<Stack orientation="horizontal" gap={5} align="center">
  <Kbd shortcut="mod+k" size="sm" />
  <Kbd shortcut="mod+k" />
</Stack>

## Muted

Set `variant` to `"muted"` to run the keys together as secondary text, as a menu shows shortcuts: ⇧⌘S on Apple platforms, Ctrl+Shift+S elsewhere. Buttons show their `shortcut` this way.

<Stack orientation="horizontal" gap={5} align="center">
  <Kbd shortcut="mod+shift+s" variant="muted" apple />
  <Kbd shortcut="mod+shift+s" variant="muted" apple={false} />
</Stack>

## Translations

Override `translateWithId` to translate the words on the keys and the names screen readers hear for Apple's symbols, such as "Strg" for Ctrl on a German keyboard.

<Kbd
  shortcut="mod+shift+s"
  apple={false}
  translateWithId={(id) => ({ ctrl: "Strg", shift: "Umschalt" })[id] ?? id}
/>

To translate every key on the page, including the keys a Button, Search or menu item shows for its `shortcut`, call `setKbdTranslations` once near the root of the app with the names to replace. A key left out keeps its English name, and a `Kbd`'s own `translateWithId` still wins. It also takes a function of the id.

```svelte
<script>
  import { setKbdTranslations } from "carbon-components-svelte";

  setKbdTranslations({ ctrl: "Strg", shift: "Umschalt" });
</script>
```

## In a button

To show a shortcut in a button, set the button's own `shortcut`: it shows the keys, announces them with `aria-keyshortcuts`, and clicks the button when they're pressed. See [Button](/components/Button#keyboard-shortcut).

| Do | Why |
| :--- | :--- |
| Use `Kbd` for keys in UI chrome: a hint, a legend, a menu | It sizes to controls and reads the platform |
| Write keys in copy as `kbd` in `Prose` | Prose keeps them inline with the text's size and line height |
| Set `shortcut` on a Button rather than placing a `Kbd` in it | The button also announces and binds the keys |
