<script>
  /**
   * Internal. A run of system events as compact lines: "Ada changed status
   * to Done".
   */

  /** @type {ReadonlyArray<import("./activity-feed.js").ActivityItem>} */
  export let events = [];

  /** The key of the group, for the "show more" toggle */
  export let groupKey = "";

  /** Set to `true` to show every event of a long group */
  export let expanded = false;

  import { getContext } from "svelte";
  import Button from "../Button/Button.svelte";
  import RelativeTime from "../RelativeTime/RelativeTime.svelte";
  import UserAvatar from "../UserAvatar/UserAvatar.svelte";
  import ActivityBodyRuns from "./ActivityBodyRuns.svelte";
  import { parseActivityBody } from "./activity-body.js";
  import { ACTIVITY_FEED_CONTEXT } from "./activity-context.js";

  /** @type {import("svelte/store").Readable<import("./activity-context.js").ActivityConfig>} */
  const config = getContext(ACTIVITY_FEED_CONTEXT);

  $: ({ texts, now, locale, timeZone, eventGroupLimit, handlers } = $config);
  $: hidden = Math.max(0, events.length - eventGroupLimit);
  $: shown =
    expanded || hidden <= 1 ? events : events.slice(0, eventGroupLimit);
  $: collapsible = hidden > 1;

  /** @param {string} body */
  function runsOf(body) {
    const block = parseActivityBody(body)[0];
    return block && "runs" in block ? block.runs : [];
  }
</script>

<ul class:bx--activity-events={true}>
  {#each shown as event (event.id)}
    <li class:bx--activity-events__line={true}>
      <UserAvatar
        size="sm"
        name={event.author.name}
        image={event.author.image}
        backgroundColor="auto"
        imageDescription=""
      />
      <span class:bx--activity-events__text={true}>
        <bdi class:bx--activity-comment__author={true}>{event.author.name}</bdi>
        <ActivityBodyRuns runs={runsOf(event.body)} />
      </span>
      <RelativeTime
        class="bx--activity-comment__time"
        date={event.createdAt}
        {now}
        {locale}
        {timeZone}
        style="short"
      />
    </li>
  {/each}
</ul>
{#if collapsible}
  <Button
    kind="ghost"
    size="sm"
    aria-expanded={expanded ? "true" : "false"}
    on:click={() => handlers.toggleEvents(groupKey)}
    >{expanded ? texts.hideEvents : texts.showEvents(hidden)}</Button
  >
{/if}
