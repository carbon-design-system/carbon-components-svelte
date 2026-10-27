<script>
  /**
   * @restProps {span}
   */

  /**
   * Specify the shortcut to show, such as `"mod+shift+p"`.
   * `mod` is Command on Apple platforms and Control elsewhere. Modifiers are
   * `mod`, `ctrl`, `alt`, `shift` and `meta`; the last part is the key
   * (`"esc"`, `"enter"`, `"up"`, `"k"`). Renders nothing when the value
   * can't be parsed. Display only; nothing listens for the keys.
   */
  export let shortcut = "";

  /**
   * Specify the caps to show, overriding `shortcut`. Use it for a sequence
   * such as `["G", "I"]`, or for a key with no shortcut name.
   * @type {ReadonlyArray<string> | undefined}
   */
  export let keys = undefined;

  /**
   * Set the size of each key.
   * @type {"sm" | "default"}
   */
  export let size = "default";

  /**
   * Set how the keys look.
   * - `"keycap"`: a boxed key
   * - `"muted"`: no box, semibold secondary text. On Windows and Linux the
   *   keys are joined by `+`.
   * @type {"keycap" | "muted"}
   */
  export let variant = "keycap";

  /**
   * Force the platform: `true` shows Command, Option and the Apple glyphs,
   * `false` shows Ctrl and Alt. Leave it unset to follow the browser. The
   * server can't tell the platform, so it renders the non-Apple form and
   * the browser switches after mount. Set it from the request when the
   * server knows the platform, to skip that switch.
   * @type {boolean | undefined}
   */
  export let apple = undefined;

  /**
   * Set to `true` to hide the keys from assistive technology. Use it when
   * another attribute, such as `aria-keyshortcuts` on a menu item, already
   * names the shortcut.
   */
  export let decorative = false;

  /**
   * Obtain a reference to the root element.
   * @bindable readonly
   * @type {null | HTMLSpanElement}
   */
  export let ref = null;

  import { onMount } from "svelte";
  import Kbd from "../Kbd/Kbd.svelte";
  import {
    applePlatform,
    shortcutKeys,
    syncPlatform,
  } from "../utils/shortcut-keys.js";

  const GLYPH = /^[⌃⌥⇧⌘↵⌫⌦⇥↑↓←→]$/;

  onMount(() => {
    if (apple === undefined) syncPlatform();
  });

  $: platform = apple ?? $applePlatform;
  $: caps = keys
    ? keys.map((label) => ({ label, name: label }))
    : shortcutKeys(shortcut, platform);
  $: joined = variant === "muted" && !keys && !platform;
</script>

{#if caps.length > 0}
  <span
    bind:this={ref}
    aria-hidden={decorative ? "true" : undefined}
    class:bx--keyboard-shortcut={true}
    class:bx--keyboard-shortcut--muted={variant === "muted"}
    {...$$restProps}
  >
    <span dir="ltr" class:bx--keyboard-shortcut__keys={true}>
      {#each caps as cap, index (index)}
        {#if joined && index > 0}<span aria-hidden="true">+</span>{/if}
        <Kbd
          {size}
          {variant}
          class={variant === "keycap" && GLYPH.test(cap.label)
            ? "bx--keyboard-shortcut__glyph"
            : undefined}
          >{#if decorative || cap.name === cap.label}{cap.label}{:else}<span
              aria-hidden="true">{cap.label}</span
            ><span class:bx--visually-hidden={true}>{cap.name}</span>{/if}</Kbd
        >
      {/each}
    </span>
  </span>
{/if}
