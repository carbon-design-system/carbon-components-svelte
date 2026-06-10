<script>
  /**
   * @template [Icon=any]
   */

  /**
   * @restProps {button}
   */

  /**
   * Specify the command this button dispatches. Use a native
   * `document.execCommand` name (for example `"bold"`, `"insertOrderedList"`,
   * `"justifyLeft"`).
   * @type {string}
   */
  export let command;

  /**
   * Specify an optional payload sent with the command, for example
   * `{ href }` for `"createLink"`.
   * @type {any}
   */
  export let value = undefined;

  /**
   * Specify the accessible name for the icon-only button.
   * @type {string}
   */
  export let iconDescription;

  /**
   * Specify the icon to render.
   * Alternatively, use the default slot.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (undefined);

  import { getContext, onMount } from "svelte";
  import { TOGGLE_COMMANDS } from "./commands.js";

  /** @type {HTMLButtonElement} */
  let node;

  const toolbar = getContext("carbon:TextToolbar");
  const editor = getContext("carbon:RichTextEditor");
  const { activeCommands, disabledCommands, disabled, dispatch } = editor;

  $: isToggle = TOGGLE_COMMANDS.includes(command);
  $: pressed = $activeCommands.has(command);
  $: isDisabled = $disabled || $disabledCommands.has(command);

  onMount(() => toolbar?.register(node));

  function handleClick() {
    if (isDisabled) return;
    dispatch({ command, value });
  }

  // Keep the editor's selection on click. Without this, pressing a button blurs
  // the contenteditable surface and collapses the selection before the command
  // runs.
  function handleMousedown(event) {
    event.preventDefault();
  }
</script>

<button
  bind:this={node}
  type="button"
  class:bx--text-toolbar__button={true}
  class:bx--text-toolbar__button--active={pressed}
  aria-label={iconDescription}
  title={iconDescription}
  aria-pressed={isToggle ? pressed : undefined}
  disabled={isDisabled}
  {...$$restProps}
  on:mousedown={handleMousedown}
  on:click={handleClick}
>
  <slot>
    {#if icon}
      <svelte:component this={icon} />
    {/if}
  </slot>
</button>
