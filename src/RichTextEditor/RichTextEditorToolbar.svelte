<script>
  /**
   * @event {{ command: import("./commands.js").RichTextCommand }} command
   * @event {{ href: string; text: string }} applylink
   * @event exit - Dispatched when Escape is pressed on a button, to return focus to the editor.
   * @event removelink
   * @event {{ trigger: "escape-key" | "outside-click" | "cancel" }} closelink
   * @restProps {div}
   */

  /**
   * The toolbar's items: command names, with `"|"` between groups.
   * @type {readonly (import("./commands.js").RichTextCommand | "|")[]}
   */
  export let items = DEFAULT_TOOLBAR;

  /**
   * The formats at the selection, which press their buttons.
   * @type {Set<string>}
   */
  export let active = new Set();

  /** Set to `true` when there is something to undo. */
  export let canUndo = false;

  /** Set to `true` when there is something to redo. */
  export let canRedo = false;

  /** Set to `true` to disable every control. */
  export let disabled = false;

  /**
   * Specify the button size. Buttons fill the toolbar's height.
   * @type {"xs" | "small" | "field" | "default"}
   */
  export let buttonSize = "field";

  /**
   * The names of the toolbar buttons.
   * @type {Partial<Record<import("./commands.js").RichTextCommand, string>>}
   */
  export let commandText = {};

  /**
   * The text of the link dialog.
   * @type {{ label: string; urlLabel: string; textLabel: string; apply: string; remove: string; invalid: string }}
   */
  export let linkText;

  /** Set to `true` to open the link dialog. */
  export let linkOpen = false;

  /** Set to `true` when the link dialog is editing an existing link. */
  export let linkExisting = false;

  /** Set to `true` to ask for the link's text, as when nothing is selected. */
  export let linkAskText = false;

  /** The link dialog's URL field. */
  export let linkHref = "";

  /** The link dialog's text field. */
  export let linkLabel = "";

  /** Set to `true` to flag the URL as invalid. */
  export let linkInvalid = false;

  /**
   * Specify the id of the editor this toolbar controls.
   * @type {string | undefined}
   */
  export let controls = undefined;

  /** Whether the platform's shortcut modifier is Command. */
  export let mac = false;

  import { createEventDispatcher, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import Popover from "../Popover/Popover.svelte";
  import TextInput from "../TextInput/TextInput.svelte";
  import { isImeComposition } from "../utils/ime-composition.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { rovingFocus } from "../utils/roving-focus.js";
  import {
    ariaShortcut,
    COMMANDS,
    DEFAULT_TOOLBAR,
    shortcutLabel,
  } from "./commands.js";

  const dispatch = createEventDispatcher();
  const layoutDirection = getLayoutDirection();

  /** @type {null | HTMLDivElement} */
  let toolbarRef = null;
  /** @type {null | HTMLInputElement} */
  let urlRef = null;
  let focusedIndex = 0;

  $: commands = items.filter(
    /** @returns {item is import("./commands.js").RichTextCommand} */
    (item) => item !== "|" && item in COMMANDS,
  );
  $: if (focusedIndex >= commands.length) focusedIndex = 0;

  /**
   * @param {import("./commands.js").RichTextCommand} command
   * @param {Partial<Record<import("./commands.js").RichTextCommand, string>>} names
   * @param {boolean} isMac
   */
  function describe(command, names, isMac) {
    const name = names[command] ?? COMMANDS[command].label;
    const shortcut = shortcutLabel(command, isMac);
    return shortcut ? `${name} (${shortcut})` : name;
  }

  /**
   * @param {import("./commands.js").RichTextCommand} command
   * @param {Set<string>} state
   */
  function isPressed(command, state) {
    const key = COMMANDS[command].state;
    return !!key && state.has(key);
  }

  /**
   * The props every toolbar button shares.
   * @param {import("./commands.js").RichTextCommand} command
   * @param {number} index
   * @param {number} stop
   * @param {boolean} off
   * @param {Set<string>} state
   * @param {Partial<Record<import("./commands.js").RichTextCommand, string>>} names
   * @param {boolean} isMac
   * @param {"xs" | "small" | "field" | "default"} size
   * @param {boolean} isDisabled
   * @returns {Record<string, any>}
   */
  function toolProps(
    command,
    index,
    stop,
    off,
    state,
    names,
    isMac,
    size,
    isDisabled,
  ) {
    const spec = COMMANDS[command];
    const pressed = spec.toggle && isPressed(command, state);
    return {
      kind: "ghost",
      size,
      iconDescription: describe(command, names, isMac),
      tooltipPosition: "bottom",
      tooltipAlignment: "center",
      isSelected: pressed,
      disabled: isDisabled,
      tabindex: index === stop ? 0 : -1,
      "aria-pressed": spec.toggle ? String(pressed) : undefined,
      "aria-disabled": off ? "true" : undefined,
      "aria-keyshortcuts": ariaShortcut(command, isMac),
      "data-tool-index": index,
      class: spec.mirror
        ? "bx--rich-text-editor__tool bx--rich-text-editor__tool--mirror"
        : "bx--rich-text-editor__tool",
    };
  }

  /**
   * Commands with nothing to do. Their buttons stay focusable, so focus
   * doesn't drop out of the toolbar as one turns off.
   * @param {boolean} undoable
   * @param {boolean} redoable
   * @param {Set<string>} state
   * @returns {Set<string>}
   */
  function findUnavailable(undoable, redoable, state) {
    const set = new Set();
    if (!undoable) set.add("undo");
    if (!redoable) set.add("redo");
    if (!state.has("list")) {
      set.add("indent");
      set.add("outdent");
    }
    return set;
  }

  $: unavailable = findUnavailable(canUndo, canRedo, active);

  // The one tab stop: the last button focused, or the first that can act.
  /**
   * @param {import("./commands.js").RichTextCommand[]} list
   * @param {number} focused
   * @param {Set<string>} off
   */
  function findStop(list, focused, off) {
    if (list[focused] && !off.has(list[focused])) return focused;
    return Math.max(
      list.findIndex((command) => !off.has(command)),
      0,
    );
  }

  $: stopIndex = findStop(commands, focusedIndex, unavailable);

  /**
   * @param {import("./commands.js").RichTextCommand} command
   */
  function handleClick(command) {
    if (disabled || unavailable.has(command)) return;
    dispatch("command", { command });
  }

  // Keep the editor's focus and selection when a button is pressed.
  /** @param {MouseEvent} event */
  function handleMousedown(event) {
    if (
      event.target instanceof Element &&
      event.target.closest(".bx--rich-text-editor__tool")
    ) {
      event.preventDefault();
    }
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (
      !(event.target instanceof Element) ||
      !event.target.closest(".bx--rich-text-editor__tool")
    ) {
      return;
    }
    // Safari keeps the editor's selection while a button has focus, and
    // would move that caret, and focus with it, on an arrow key.
    if (
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      (event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown")
    ) {
      event.preventDefault();
    } else if (event.key === "Escape" && !linkOpen) {
      dispatch("exit");
    }
  }

  /** @param {FocusEvent} event */
  function handleFocusin(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const index = Number(target.dataset.toolIndex);
    if (!Number.isNaN(index) && target.dataset.toolIndex !== undefined) {
      focusedIndex = index;
    }
  }

  $: if (linkOpen) {
    tick().then(() => urlRef?.focus());
  }

  function handleSubmit() {
    dispatch("applylink", { href: linkHref, text: linkLabel });
  }

  // Enter applies the link. It must not reach a `form` around the editor.
  /** @param {KeyboardEvent} event */
  function handleLinkKeydown(event) {
    if (event.key !== "Enter" || isImeComposition(event)) return;
    event.preventDefault();
    handleSubmit();
  }

  /** @param {CustomEvent<{ trigger: "escape-key" | "outside-click" }>} event */
  function handlePopoverClose(event) {
    dispatch("closelink", { trigger: event.detail.trigger });
  }

  function isRtl() {
    return resolveLayoutDirection($layoutDirection, toolbarRef) === "rtl";
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div
  bind:this={toolbarRef}
  role="toolbar"
  aria-orientation="horizontal"
  aria-controls={controls}
  class:bx--rich-text-editor__toolbar={true}
  use:rovingFocus={{
    selector: ".bx--rich-text-editor__tool",
    getActiveIndex: () => focusedIndex,
    onMove: (index) => (focusedIndex = index),
    focusOnMove: true,
    skipDisabled: true,
    itemsOnly: true,
    rtl: isRtl,
  }}
  {...$$restProps}
  on:mousedown={handleMousedown}
  on:keydown={handleKeydown}
  on:focusin={handleFocusin}
>
  {#each items as item, position (`${item}-${position}`)}
    {#if item === "|"}
      <span class:bx--rich-text-editor__separator={true} aria-hidden="true"
      ></span>
    {:else if item in COMMANDS}
      {@const spec = COMMANDS[item]}
      {@const index = commands.indexOf(item)}
      {@const off = !disabled && unavailable.has(item)}
      {@const button = toolProps(
        item,
        index,
        stopIndex,
        off,
        active,
        commandText,
        mac,
        buttonSize,
        disabled,
      )}
      {#if item === "link"}
        <div class:bx--rich-text-editor__link-anchor={true}>
          <Button
            {...button}
            icon={spec.icon}
            aria-haspopup="dialog"
            aria-expanded={linkOpen ? "true" : "false"}
            isSelected={linkOpen || active.has("link")}
            on:click={() => handleClick(item)}
          />
          <Popover
            open={linkOpen}
            align="bottom-start"
            closeOnEscape
            closeOnOutsideClick
            on:close={handlePopoverClose}
          >
            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            <div
              role="dialog"
              tabindex="-1"
              aria-label={linkText.label}
              class:bx--rich-text-editor__link-form={true}
              on:keydown={handleLinkKeydown}
            >
              {#if linkOpen}
                <TextInput
                  size="sm"
                  labelText={linkText.urlLabel}
                  placeholder="https://"
                  inputmode="url"
                  autocomplete="off"
                  invalid={linkInvalid}
                  invalidText={linkText.invalid}
                  bind:value={linkHref}
                  bind:ref={urlRef}
                />
                {#if linkAskText}
                  <TextInput
                    size="sm"
                    labelText={linkText.textLabel}
                    autocomplete="off"
                    bind:value={linkLabel}
                  />
                {/if}
                <div class:bx--rich-text-editor__link-actions={true}>
                  {#if linkExisting}
                    <Button
                      kind="ghost"
                      size="small"
                      on:click={() => dispatch("removelink")}
                    >
                      {linkText.remove}
                    </Button>
                  {/if}
                  <Button kind="primary" size="small" on:click={handleSubmit}>
                    {linkText.apply}
                  </Button>
                </div>
              {/if}
            </div>
          </Popover>
        </div>
      {:else if spec.icon}
        <Button
          {...button}
          icon={spec.icon}
          on:click={() => handleClick(item)}
        />
      {:else}
        <Button {...button} on:click={() => handleClick(item)}>
          <span
            slot="icon"
            class:bx--rich-text-editor__glyph={true}
            aria-hidden="true">{spec.glyph}</span
          >
        </Button>
      {/if}
    {/if}
  {/each}
</div>
