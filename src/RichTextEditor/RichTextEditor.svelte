<script>
  /**
   * @event {string} change
   * @restProps {div}
   */

  /**
   * Specify the editor content as an HTML string.
   * The value is not sanitized; sanitize it before rendering it elsewhere.
   * @type {string}
   * @bindable writable
   */
  export let value = "";

  /** Set to `true` to disable the editor and its toolbar. */
  export let disabled = false;

  /**
   * Set an id for the container element.
   * @type {string}
   */
  export let id = undefined;

  import { createEventDispatcher, setContext } from "svelte";
  import { readonly, writable } from "svelte/store";

  const dispatch = createEventDispatcher();

  /** @type {import("./commands.js").RichTextAdapter | null} */
  let adapter = null;

  const valueStore = writable(value);
  const activeCommands = writable(/** @type {Set<string>} */ (new Set()));
  const disabledCommands = writable(/** @type {Set<string>} */ (new Set()));
  const editorDisabled = writable(disabled);

  function refreshState() {
    if (!adapter) {
      activeCommands.set(new Set());
      disabledCommands.set(new Set());
      return;
    }
    const state = adapter.queryState();
    activeCommands.set(state.active);
    disabledCommands.set(state.disabled);
  }

  /**
   * @param {import("./commands.js").RichTextAdapter} next
   * @returns {() => void}
   */
  function registerEditor(next) {
    adapter = next;
    refreshState();
    return () => {
      if (adapter === next) adapter = null;
    };
  }

  /** @param {import("./commands.js").RichTextCommand} command */
  function runCommand(command) {
    if (disabled || !adapter) return;
    adapter.focus();
    adapter.execute(command);
    refreshState();
  }

  /** @param {string} html */
  function setValue(html) {
    if (html === value) return;
    value = html;
    dispatch("change", html);
  }

  setContext("carbon:RichTextEditor", {
    value: readonly(valueStore),
    activeCommands: readonly(activeCommands),
    disabledCommands: readonly(disabledCommands),
    disabled: readonly(editorDisabled),
    dispatch: runCommand,
    registerEditor,
    refreshState,
    setValue,
  });

  $: valueStore.set(value);
  $: editorDisabled.set(disabled);
</script>

<div {id} class:bx--rich-text-editor={true} {...$$restProps}>
  <slot />
</div>
