<script>
  /**
   * The comments on one annotation and the field to add one. Used inside the
   * popover card of `TextAnnotations`.
   * @event {{ body: string }} submit
   * @event {null} close
   * @event {null} remove
   */

  /**
   * The thread to show. `null` for a comment that has no annotation yet.
   * @type {null | import("./TextAnnotations.svelte").TextAnnotation}
   */
  export let annotation = null;

  /** The text the thread is about, already shortened. */
  export let quote = "";

  /** Whether the user may add comments. */
  export let canReply = true;

  /** Whether the user may delete the thread. */
  export let canRemove = true;

  /**
   * The id the parts derive theirs from.
   * @type {string}
   */
  export let id = "";

  /** @type {string} */
  export let labelText = "Reply";

  export let submitText = "Comment";
  export let cancelText = "Cancel";
  export let closeIconDescription = "Close";
  export let removeText = "Delete thread";

  /**
   * @type {null | HTMLTextAreaElement}
   */
  export let composerRef = null;

  import { createEventDispatcher } from "svelte";
  import Button from "../Button/Button.svelte";
  import RelativeTime from "../RelativeTime/RelativeTime.svelte";
  import TextArea from "../TextArea/TextArea.svelte";
  import UserAvatar from "../UserAvatar/UserAvatar.svelte";
  import Close from "../icons/Close.svelte";
  import { isImeComposition } from "../utils/ime-composition.js";
  import { matchesShortcut } from "../utils/keyboard-shortcut.js";

  const dispatch = createEventDispatcher();

  let value = "";

  $: comments = annotation ? annotation.comments : [];
  $: empty = value.trim() === "";

  function submit() {
    if (empty) return;
    dispatch("submit", { body: value.trim() });
    value = "";
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (isImeComposition(event)) return;
    if (matchesShortcut(event, "mod+enter")) {
      event.preventDefault();
      submit();
    }
  }
</script>

<div class="bx--text-annotations__thread">
  <div class="bx--text-annotations__thread-header">
    <span class="bx--text-annotations__thread-quote" dir="auto">{quote}</span>
    <Button
      kind="ghost"
      size="sm"
      icon={Close}
      iconDescription={closeIconDescription}
      tooltipPosition="left"
      on:click={() => dispatch("close")}
    />
  </div>
  {#if comments.length}
    <ol class="bx--text-annotations__comments" aria-label={quote}>
      {#each comments as comment (comment.id)}
        <li class="bx--text-annotations__comment">
          <UserAvatar
            size="sm"
            name={comment.author.name}
            backgroundColor="auto"
          />
          <div class="bx--text-annotations__comment-main">
            <p class="bx--text-annotations__comment-meta">
              <span class="bx--text-annotations__comment-author"
                >{comment.author.name}</span
              >
              {#if comment.createdAt !== undefined}
                <RelativeTime date={comment.createdAt} style="short" />
              {/if}
            </p>
            <p class="bx--text-annotations__comment-body" dir="auto">
              {comment.body}
            </p>
          </div>
        </li>
      {/each}
    </ol>
  {/if}
  {#if canReply}
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="bx--text-annotations__composer" on:keydown={handleKeydown}>
      <TextArea
        id="{id}-composer"
        bind:ref={composerRef}
        bind:value
        {labelText}
        hideLabel
        rows={2}
        grow
        maxRows={6}
      />
      <div class="bx--text-annotations__composer-actions">
        {#if annotation && canRemove}
          <Button
            kind="danger-ghost"
            size="sm"
            on:click={() => dispatch("remove")}
          >
            {removeText}
          </Button>
        {/if}
        {#if !annotation}
          <Button kind="ghost" size="sm" on:click={() => dispatch("close")}>
            {cancelText}
          </Button>
        {/if}
        <Button size="sm" disabled={empty} on:click={submit}>
          {submitText}
        </Button>
      </div>
    </div>
  {/if}
</div>
