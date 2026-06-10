<script>
  /**
   * @restProps {div}
   */

  /** Specify the placeholder shown while the editor is empty. */
  export let placeholder = "";

  import { getContext, onMount } from "svelte";
  import { createExecCommandAdapter } from "./commands.js";

  /** @type {HTMLDivElement} */
  let node;
  let focused = false;

  const editor = getContext("carbon:RichTextEditor");
  const { value, setValue, registerEditor, refreshState, disabled } = editor;

  function handleSelectionChange() {
    if (focused) refreshState();
  }

  function handleInput() {
    setValue(node.innerHTML);
    refreshState();
  }

  function handleFocus() {
    focused = true;
    document.addEventListener("selectionchange", handleSelectionChange);
    refreshState();
  }

  function handleBlur() {
    focused = false;
    document.removeEventListener("selectionchange", handleSelectionChange);
  }

  onMount(() => {
    node.innerHTML = $value ?? "";
    const unregister = registerEditor(createExecCommandAdapter(node));
    return () => {
      unregister();
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  });

  // Reflect external value changes into the DOM, but never while focused — that
  // would move the caret mid-edit.
  $: if (
    node &&
    !focused &&
    $value !== undefined &&
    $value !== node.innerHTML
  ) {
    node.innerHTML = $value;
  }

  $: ({ "aria-label": ariaLabel, ...rest } = $$restProps);
</script>

<div
  bind:this={node}
  role="textbox"
  aria-multiline="true"
  aria-label={ariaLabel ?? "Rich text editor"}
  contenteditable={!$disabled}
  tabindex={$disabled ? -1 : 0}
  data-placeholder={placeholder}
  class:bx--rich-text-editor__content={true}
  {...rest}
  on:input={handleInput}
  on:focus={handleFocus}
  on:blur={handleBlur}
></div>
