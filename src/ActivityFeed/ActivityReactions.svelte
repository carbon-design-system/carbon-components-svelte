<script>
  /**
   * Internal. The reaction toggles under a comment.
   */

  /** @type {import("./activity-feed.js").ActivityItem} */
  export let item;

  import { getContext } from "svelte";
  import OverflowMenu from "../OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "../OverflowMenu/OverflowMenuItem.svelte";
  import SelectableTag from "../Tag/SelectableTag.svelte";
  import Add from "../icons/Add.svelte";
  import { ACTIVITY_FEED_CONTEXT } from "./activity-context.js";
  import { summarizeReactions } from "./activity-feed.js";

  /** @type {import("svelte/store").Readable<import("./activity-context.js").ActivityConfig>} */
  const config = getContext(ACTIVITY_FEED_CONTEXT);

  $: ({ user, nameOf, texts, reactions: available, handlers } = $config);
  $: summary = summarizeReactions(item, user?.id, nameOf);
  $: labels = new Map(available.map((reaction) => [reaction.emoji, reaction]));
  // The menu offers what the reader has not already used.
  $: unused = available.filter(
    (reaction) =>
      !summary.some((other) => other.emoji === reaction.emoji && other.mine),
  );
</script>

{#if summary.length > 0 || available.length > 0}
  <div
    role="group"
    aria-label={texts.reactionsLabel}
    class:bx--activity-reactions={true}
  >
    {#each summary as reaction (reaction.emoji)}
      {@const label = labels.get(reaction.emoji)?.label ?? reaction.emoji}
      <SelectableTag
        size="sm"
        selected={reaction.mine}
        aria-label={texts.reactionLabel({ ...reaction, label })}
        title={texts.reactionLabel({ ...reaction, label })}
        on:change={() => handlers.react(item.id, reaction.emoji)}
      >
        <span aria-hidden="true" class:bx--activity-reactions__emoji={true}
          >{reaction.emoji}</span
        >
        <span aria-hidden="true">{reaction.count}</span>
      </SelectableTag>
    {/each}
    {#if unused.length > 0}
      <!-- A row is `content-visibility: auto`, which clips what overflows it as
           `overflow` does. The menu only portals when an `overflow` box clips
           it, so it is told to. -->
      <OverflowMenu
        size="sm"
        icon={Add}
        iconDescription={texts.addReaction}
        portalMenu
      >
        {#each unused as reaction (reaction.emoji)}
          <OverflowMenuItem
            text="{reaction.emoji} {reaction.label}"
            on:click={() => handlers.react(item.id, reaction.emoji)}
          />
        {/each}
      </OverflowMenu>
    {/if}
  </div>
{/if}
