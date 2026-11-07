<script>
  /**
   * @typedef {"ctrl" | "control" | "alt" | "option" | "shift" | "meta" | "command" | "enter" | "return" | "escape" | "escapeName" | "tab" | "backspace" | "delete" | "forwardDelete" | "del" | "forwardDel" | "space" | "arrowUp" | "arrowDown" | "arrowLeft" | "arrowRight" | "pageUp" | "pageDown" | "home" | "end"} KbdTranslationId
   * @restProps {kbd}
   * @slot {{}}
   */

  /**
   * Specify the shortcut to show, such as `"mod+k"` or `"shift+?"`. `mod`
   * shows Command on Apple platforms and Ctrl elsewhere. Leave it empty
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
   * them together as secondary text, as menus show shortcuts: icons run
   * together on Apple platforms, Ctrl+Shift+P elsewhere.
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
    del: "del",
    forwardDel: "forwardDel",
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
   * screen readers for the icons shown on Apple platforms. A key it
   * returns `undefined` for uses the nearest `setKbdTranslations`, then
   * English.
   * @type {(id: KbdTranslationId) => string | undefined}
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

  import ArrowDown from "../icons/ArrowDown.svelte";
  import ArrowLeft from "../icons/ArrowLeft.svelte";
  import ArrowRight from "../icons/ArrowRight.svelte";
  import ArrowUp from "../icons/ArrowUp.svelte";
  import ChevronUp from "../icons/ChevronUp.svelte";
  import MacCommand from "../icons/MacCommand.svelte";
  import MacOption from "../icons/MacOption.svelte";
  import MacShift from "../icons/MacShift.svelte";
  import PageLast from "../icons/PageLast.svelte";
  import Return from "../icons/Return.svelte";
  import { applePlatform } from "../utils/keyboard-shortcut.js";
  import { KBD_TRANSLATIONS, kbdKeys } from "./kbd-keys.js";
  import { getKbdTranslations } from "./kbd-translations.js";

  const shared = getKbdTranslations();

  const ICONS = {
    command: MacCommand,
    option: MacOption,
    shift: MacShift,
    control: ChevronUp,
    return: Return,
    tab: PageLast,
    arrowUp: ArrowUp,
    arrowDown: ArrowDown,
    arrowLeft: ArrowLeft,
    arrowRight: ArrowRight,
  };

  $: isApple = apple ?? $applePlatform;
  /** @type {(id: KbdTranslationId) => string} */
  let translate;
  $: translate = (id) =>
    translateWithId(id) ?? shared?.(id) ?? KBD_TRANSLATIONS[id];

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
          { id: "other", ...describe(shortcut, false, translate) },
          { id: "apple", ...describe(shortcut, true, translate) },
        ]
      : [
          {
            id: apple ? "apple" : "other",
            ...describe(shortcut, apple, translate),
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
            aria-hidden="true"
            >{#if key.icon}<svelte:component
                this={ICONS[key.icon]}
                class="bx--kbd__icon"
                data-icon={key.icon}
              />{:else}{key.label}{/if}</kbd
          >{/each}</span
      >
    {/each}
  {:else}
    <kbd class:bx--kbd__key={true}><slot /></kbd>
  {/if}
</kbd>
