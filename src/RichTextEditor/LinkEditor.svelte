<script>
  /**
   * @template [Icon=any]
   */

  /**
   * @slot {{}} icon
   */

  /** Specify the accessible name for the trigger button. */
  export let iconDescription = "Link";

  /**
   * Specify the icon to render in the trigger.
   * Alternatively, use the "icon" slot.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  /** Specify the placeholder for the URL input. */
  export let placeholder = "https://example.com";

  /** Specify the (visually hidden) label for the URL input. */
  export let labelText = "URL";

  /** Specify the text for the apply action. */
  export let linkText = "Apply";

  /** Specify the text for the remove-link action. */
  export let removeText = "Remove";

  /**
   * Specify the alignment of the popover relative to the trigger.
   * @type {"top" | "top-left" | "top-right" | "bottom" | "bottom-left" | "bottom-right" | "left" | "left-bottom" | "left-top" | "right" | "right-bottom" | "right-top"}
   */
  export let align = "bottom-left";

  import { getContext, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import Popover from "../Popover/Popover.svelte";
  import TextInput from "../TextInput/TextInput.svelte";

  /** @type {HTMLButtonElement} */
  let triggerNode;
  /** @type {HTMLDivElement} */
  let containerNode;
  /** @type {HTMLInputElement} */
  let inputRef = null;
  let open = false;
  let href = "";
  /** @type {Range | null} */
  let savedRange = null;

  const toolbar = getContext("carbon:TextToolbar");
  const editor = getContext("carbon:RichTextEditor");
  const { disabled, dispatch } = editor;

  onMount(() => toolbar?.register(triggerNode));

  function saveSelection() {
    if (typeof window === "undefined") return;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedRange = selection.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelection() {
    if (!savedRange || typeof window === "undefined") return;
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(savedRange);
  }

  async function toggle() {
    if ($disabled) return;
    if (open) {
      close();
      return;
    }
    saveSelection();
    open = true;
    await tick();
    inputRef?.focus();
  }

  function close() {
    open = false;
  }

  function apply() {
    restoreSelection();
    if (href) dispatch({ command: "createLink", value: { href } });
    href = "";
    close();
    triggerNode.focus();
  }

  function remove() {
    restoreSelection();
    dispatch({ command: "unlink" });
    close();
    triggerNode.focus();
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
      triggerNode.focus();
    } else if (event.key === "Enter") {
      event.preventDefault();
      apply();
    }
  }
</script>

<div
  bind:this={containerNode}
  class:bx--text-toolbar__link={true}
  style:position="relative"
>
  <button
    bind:this={triggerNode}
    type="button"
    class:bx--text-toolbar__button={true}
    aria-label={iconDescription}
    title={iconDescription}
    aria-haspopup="dialog"
    aria-expanded={open}
    disabled={$disabled}
    on:mousedown={(event) => event.preventDefault()}
    on:click={toggle}
  >
    <slot name="icon">
      {#if icon}
        <svelte:component this={icon} />
      {/if}
    </slot>
  </button>
  <Popover
    bind:open
    {align}
    on:click:outside={({ detail }) => {
      if (!containerNode.contains(detail.target)) close();
    }}
  >
    <div
      class:bx--text-toolbar__link-form={true}
      role="dialog"
      tabindex="-1"
      aria-label={iconDescription}
      on:keydown={handleKeydown}
    >
      <TextInput
        bind:ref={inputRef}
        bind:value={href}
        {placeholder}
        {labelText}
        hideLabel
        size="sm"
      />
      <Button size="small" on:click={apply}>{linkText}</Button>
      <Button size="small" kind="ghost" on:click={remove}>{removeText}</Button>
    </div>
  </Popover>
</div>
