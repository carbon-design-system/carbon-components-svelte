<script>
  /**
   * @typedef {"ctrl" | "control" | "alt" | "option" | "shift" | "meta" | "command" | "enter" | "return" | "escape" | "escapeName" | "tab" | "backspace" | "delete" | "forwardDelete" | "space" | "arrowUp" | "arrowDown" | "arrowLeft" | "arrowRight" | "pageUp" | "pageDown" | "home" | "end"} KbdTranslationId
   * @restProps {kbd}
   * @slot {{}}
   */

  /**
   * Specify the shortcut to show, such as `"mod+k"` or `"shift+?"`. `mod`
   * shows Command (⌘) on Apple platforms and Ctrl elsewhere. Leave it empty
   * to show the default slot as one key.
   */
  export let shortcut = "";

  /**
   * Specify the size of the keys.
   * @type {"sm" | "default"}
   */
  export let size = "default";

  /**
   * Specify how the keys look: `"keycap"` boxes each key; `"muted"` runs
   * them together as secondary text, as menus show shortcuts (⇧⌘P on Apple
   * platforms, Ctrl+Shift+P elsewhere).
   * @type {"keycap" | "muted"}
   */
  export let variant = "keycap";

  /**
   * Set to `true` to show the keys as on an Apple platform, or `false` as
   * elsewhere. Unset, it follows the browser once mounted; the server renders
   * the keys for other platforms.
   * @type {boolean | undefined}
   */
  export let apple = undefined;

  /** Default translation ids */
  export const translationIds = /** @type {const} */ ({
    ctrl: "ctrl",
    control: "control",
    alt: "alt",
    option: "option",
    shift: "shift",
    meta: "meta",
    command: "command",
    enter: "enter",
    return: "return",
    escape: "escape",
    escapeName: "escapeName",
    tab: "tab",
    backspace: "backspace",
    delete: "delete",
    forwardDelete: "forwardDelete",
    space: "space",
    arrowUp: "arrowUp",
    arrowDown: "arrowDown",
    arrowLeft: "arrowLeft",
    arrowRight: "arrowRight",
    pageUp: "pageUp",
    pageDown: "pageDown",
    home: "home",
    end: "end",
  });

  /**
   * Override the default translations of the key names. Words such as
   * "Ctrl" are shown on the keys; names such as "Command" are read by
   * screen readers for the symbols shown on Apple platforms. Unset, it uses
   * the nearest `setKbdTranslations`, then English.
   * @type {(id: KbdTranslationId) => string}
   */
  export let translateWithId = function translateWithId(id) {
    return shared?.(id) ?? KBD_TRANSLATIONS[id];
  };

  /**
   * Obtain a reference to the outer `kbd` element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import { applePlatform } from "../utils/keyboard-shortcut.js";
  import { KBD_TRANSLATIONS, kbdKeys } from "./kbd-keys.js";
  import { getKbdTranslations } from "./kbd-translations.js";

  const shared = getKbdTranslations();

  $: isApple = apple ?? $applePlatform;

  /**
   * @param {string} value
   * @param {boolean} onApple
   * @param {(id: KbdTranslationId) => string} translate
   */
  function describe(value, onApple, translate) {
    const keys = kbdKeys(value, onApple, translate);
    return { keys, names: keys.map((key) => key.name).join(" ") };
  }

  // Unless `apple` is set, both platforms' keys render in one place and CSS
  // shows one: the page's (`<html data-ccs-platform>`, from `platformScript`)
  // or, without it, the other platforms' until mount. The place is as wide
  // as the wider set, so the swap never moves the layout.
  $: platforms =
    apple === undefined
      ? [
          { id: "other", ...describe(shortcut, false, translateWithId) },
          { id: "apple", ...describe(shortcut, true, translateWithId) },
        ]
      : [
          {
            id: apple ? "apple" : "other",
            ...describe(shortcut, apple, translateWithId),
          },
        ];
  $: hasKeys = platforms[0].keys.length > 0;
</script>

<kbd
  bind:this={ref}
  class:bx--kbd={true}
  class:bx--kbd--sm={size === "sm"}
  class:bx--kbd--muted={variant === "muted"}
  class:bx--kbd--apple={isApple}
  class:bx--kbd--both={apple === undefined}
  {...$$restProps}
>
  {#if hasKeys}
    {#each platforms as platform (platform.id)}
      <span
        class:bx--kbd__platform={true}
        class:bx--kbd__platform--apple={platform.id === "apple"}
        class:bx--kbd__platform--other={platform.id === "other"}
        ><span class:bx--visually-hidden={true}>{platform.names}</span
        >{#each platform.keys as key, index (index)}<kbd
            class:bx--kbd__key={true}
            aria-hidden="true">{key.label}</kbd
          >{/each}</span
      >
    {/each}
  {:else}
    <kbd class:bx--kbd__key={true}><slot /></kbd>
  {/if}
</kbd>
