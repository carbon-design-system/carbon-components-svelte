<script>
  /**
   * @restProps {form}
   * @event {{ body: string }} submit - Dispatched with the text when the form is submitted by the button or by `mod+Enter`. The field is cleared and the draft forgotten unless the event is cancelled.
   * @event {null} cancel - Dispatched when Cancel is pressed, or Escape in a field that shows Cancel.
   */

  /**
   * The text of the comment, with mentions written as `@[Name](id)` tokens
   * so the ids survive in the string.
   * @bindable writable
   */
  export let value = "";

  /** Specify the label text of the field */
  export let labelText = "Comment";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = true;

  /** Specify the placeholder text of the field */
  export let placeholder = "Write a comment";

  /** Specify the text of the submit button */
  export let submitText = "Comment";

  /**
   * Specify the text of the cancel button. It shows only when `cancelable`
   * is `true`.
   */
  export let cancelText = "Cancel";

  /** Set to `true` to show the cancel button, as when editing or replying */
  export let cancelable = false;

  /** Specify the number of visible rows of the field */
  export let rows = 3;

  /**
   * Specify the people that `@` completes. A comment keeps each mention as a
   * `@[Name](id)` token. Leave it empty to turn mentions off.
   * @type {ReadonlyArray<import("../Mentions/Mentions.svelte").MentionItem>}
   */
  export let mentionItems = [];

  /**
   * Set a key to keep the unsent text in `localStorage` while it is typed,
   * so a reload or a closed tab does not lose it. Use one key per thread.
   * The draft is removed when the form is submitted or cancelled.
   * @type {string | undefined}
   */
  export let draftKey = undefined;

  /**
   * Specify the shortcut that submits from inside the field. `mod` is
   * Command on Apple platforms and Control elsewhere.
   */
  export let shortcut = "mod+enter";

  /** Set to `true` to disable the form */
  export let disabled = false;

  /**
   * Set to `true` while the text is being sent. The button shows it is busy.
   * The field stays editable, so nothing typed meanwhile is lost.
   */
  export let busy = false;

  /** Specify the text screen readers hear for the busy button */
  export let busyText = "Sending";

  /** Specify the text of the hint under the field. Set to `""` to hide it. */
  export let hintText = "to submit";

  /** Specify the label of the mention menu */
  export let mentionLabel = "People";

  /** Set an id for the field */
  export let id = uniqueId();

  /**
   * Obtain a reference to the field.
   * @type {null | HTMLTextAreaElement}
   * @bindable readonly
   */
  export let ref = null;

  /** Move focus into the field. */
  export function focus() {
    ref?.focus();
  }

  import { createEventDispatcher, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import Kbd from "../Kbd/Kbd.svelte";
  import LocalStorage from "../LocalStorage/LocalStorage.svelte";
  import Mentions from "../Mentions/Mentions.svelte";
  import TextArea from "../TextArea/TextArea.svelte";
  import { debounce } from "../utils/debounce.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { matchesShortcut } from "../utils/keyboard-shortcut.js";
  import { uniqueId } from "../utils/unique-id.js";

  const dispatch = createEventDispatcher();

  /** @type {undefined | LocalStorage} */
  let storage;
  /** The value `LocalStorage` holds. `undefined` after it was cleared. */
  let stored = "";
  let mentionsOpen = false;
  let mounted = false;

  $: triggers = mentionItems.length
    ? [
        {
          char: "@",
          items: mentionItems,
          format: /** @type {const} */ ("token"),
          label: mentionLabel,
        },
      ]
    : [];
  $: canSubmit = value.trim().length > 0 && !disabled;

  // `LocalStorage` fills `stored` once it has read the key. Take the saved
  // text only into an empty field, so text typed before it arrived is kept.
  $: if (mounted && draftKey && stored && !value) value = stored;

  // One write per pause in typing, and none for an empty field: `LocalStorage`
  // writes on every change, and a key left holding "" is only clutter.
  const persist = debounce((/** @type {unknown} */ next) => {
    if (!draftKey) return;
    if (typeof next === "string" && next) {
      if (next !== stored) stored = next;
    } else if (stored) {
      forget();
    }
  }, 300);

  $: if (mounted && draftKey) persist(value);

  function forget() {
    persist.cancel();
    stored = "";
    storage?.clearItem();
  }

  function submit() {
    if (!canSubmit || busy) return;
    const body = value.trim();
    const proceed = dispatch("submit", { body }, { cancelable: true });
    if (!proceed) return;
    value = "";
    forget();
    ref?.focus();
  }

  function cancel() {
    forget();
    dispatch("cancel");
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (isImeComposition(event)) return;
    if (matchesShortcut(event, shortcut)) {
      event.preventDefault();
      submit();
      return;
    }
    // The menu takes the first Escape.
    if (event.key === "Escape" && cancelable && !mentionsOpen) {
      event.preventDefault();
      cancel();
    }
  }

  onMount(() => {
    mounted = true;
    // `LocalStorage` writes the empty field it was given when the key is new.
    tick().then(() => {
      if (!stored) storage?.clearItem();
    });
    return () => persist.flush();
  });
</script>

<svelte:window on:pagehide={persist.flush} />

<form
  class:bx--activity-composer={true}
  on:submit|preventDefault={submit}
  {...$$restProps}
>
  {#if draftKey}
    {#key draftKey}
      <LocalStorage
        bind:this={storage}
        bind:value={stored}
        key={draftKey}
        sync="off"
      />
    {/key}
  {/if}
  <TextArea
    bind:ref
    bind:value
    {id}
    {labelText}
    {hideLabel}
    {placeholder}
    {rows}
    {disabled}
    on:keydown={handleKeydown}
  />
  <Mentions field={ref} {triggers} bind:open={mentionsOpen} />
  <div class:bx--activity-composer__actions={true}>
    {#if hintText}
      <span class:bx--activity-composer__hint={true}>
        <Kbd {shortcut} size="sm" variant="muted" />
        {hintText}
      </span>
    {/if}
    {#if cancelable}
      <Button kind="ghost" size="sm" on:click={cancel}>{cancelText}</Button>
    {/if}
    <Button
      type="submit"
      size="sm"
      disabled={!canSubmit}
      loading={busy}
      loadingDescription={busyText}>{submitText}</Button
    >
  </div>
</form>
