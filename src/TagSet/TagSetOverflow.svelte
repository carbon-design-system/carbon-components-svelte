<script>
  /**
   * Internal: the "+N" overflow indicator. Not exported from the package;
   * only `TagSet` ships. Hovering shows a tooltip (a comma-separated list of
   * the hidden labels by default, or custom content via the forwarded
   * `overflowTooltip` slot); clicking dispatches `trigger`.
   *
   * Always mounted (even when `count` is 0) so it stays measurable; visually
   * and functionally inert until there is something to show.
   *
   * With `mode="popover"`, the indicator is an `OperationalTag` whose
   * popover lists the hidden tags as tags, so dismissible ones can still be
   * closed.
   *
   * @event {null} trigger - The indicator was clicked.
   * @event {import("./TagSet.svelte").TagSetItem} close - A dismissible tag in the popover was closed.
   * @event {null} empty - The popover held focus and has no tag left to take it.
   * @slot {{ tags: import("./TagSet.svelte").TagSetItem[]; count: number }} tooltip - Override the tooltip or popover content.
   */

  /** @type {"tooltip" | "popover"} */
  export let mode = "tooltip";

  /** Set to `true` when the parent passes custom `tooltip` slot content. */
  export let customContent = false;

  /**
   * Whether the popover is open, with `mode="popover"`.
   * @bindable writable
   */
  export let open = false;

  /**
   * Obtain a reference to the popover content, with `mode="popover"`.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let contentRef = null;

  /**
   * Obtain a reference to the indicator's HTML element, so the parent can
   * measure its natural width for the fit calculation.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let triggerRef = null;

  /**
   * Obtain a reference to the indicator's focusable button, for the
   * parent's roving keyboard navigation.
   * @bindable readonly
   * @type {null | HTMLButtonElement}
   */
  export let buttonRef = null;

  /**
   * Roving `tabindex` from the parent. `undefined` keeps the native order.
   * @type {"0" | "-1" | undefined}
   */
  export let tabindex = undefined;

  /** @type {string | undefined} */
  export let id = undefined;

  /** @type {number} */
  export let count = 0;

  /** @type {import("./TagSet.svelte").TagSetItem[]} */
  export let tags = [];

  /** @type {"start" | "center" | "end"} */
  export let overflowAlign = "center";

  /** @type {"top" | "bottom"} */
  export let overflowDirection = "bottom";

  /** @type {(count: number) => string} */
  export let overflowLabel = (count) => `+${count} more tags`;

  /** @type {"sm" | "default" | "lg" | undefined} */
  export let size = undefined;

  import { afterUpdate, createEventDispatcher, setContext } from "svelte";
  import OperationalTag from "../Tag/OperationalTag.svelte";
  import Tag from "../Tag/Tag.svelte";
  import TooltipDefinition from "../TooltipDefinition/TooltipDefinition.svelte";

  // The indicator is presentational, not a registered group item — shadow
  // the context so it can't be mistaken for one.
  setContext("carbon:TagSet", undefined);

  const dispatch = createEventDispatcher();

  /**
   * A popover tag closed while focus was in the popover: once that tag is
   * gone from `tags`, move focus to the tag now at its position, else the
   * one before it. Svelte 3 and 4 remove it an update later than Svelte 5,
   * so wait for it in `afterUpdate` instead of a fixed number of ticks.
   * @type {null | { id: string; position: number }}
   */
  let pendingFocus = null;

  /** @param {import("./TagSet.svelte").TagSetItem} tag */
  function handleTagClose(tag) {
    const position = tags.indexOf(tag);
    pendingFocus = contentRef?.contains(document.activeElement)
      ? { id: tag.id, position }
      : null;
    dispatch("close", tag);
  }

  afterUpdate(() => {
    if (!pendingFocus || tags.some((tag) => tag.id === pendingFocus?.id)) {
      return;
    }
    const { position } = pendingFocus;
    pendingFocus = null;
    const buttons = Array.from(
      contentRef?.querySelectorAll(".bx--tag__close-icon:not(:disabled)") ?? [],
    );
    const target = buttons[Math.min(position, buttons.length - 1)];
    if (target instanceof HTMLElement) target.focus();
    else dispatch("empty");
  });

  // The popover trigger is itself the measured tag.
  $: if (mode === "popover") triggerRef = buttonRef;

  // `TooltipDefinition` keeps its rest props on the outer wrapper, so set
  // the roving `tabindex` on its button directly.
  $: if (mode === "tooltip" && buttonRef) {
    if (tabindex === undefined) buttonRef.removeAttribute("tabindex");
    else buttonRef.setAttribute("tabindex", tabindex);
  }
</script>

{#if mode === "popover"}
  <span
    class:bx--tag-set-overflow={true}
    class:bx--tag-set-overflow--empty={count === 0}
  >
    <OperationalTag
      bind:ref={buttonRef}
      bind:contentRef
      bind:open
      {id}
      {size}
      {tabindex}
      align={overflowAlign}
      direction={overflowDirection}
      class="bx--tag-set-overflow__popover-trigger"
      on:click={() => dispatch("trigger")}
    >
      <span aria-hidden="true">+{count}</span>
      <span class:bx--visually-hidden={true}>{overflowLabel(count)}</span>
      <svelte:fragment slot="content">
        {#if customContent}
          <slot name="tooltip" {tags} {count} />
        {:else}
          <ul class:bx--tag-set-overflow__list={true}>
            {#each tags as tag (tag.id)}
              <li>
                <Tag
                  type={tag.type}
                  filter={tag.filter}
                  disabled={tag.disabled}
                  value={tag.value}
                  {size}
                  on:close={() => handleTagClose(tag)}
                >
                  {tag.label}
                </Tag>
              </li>
            {/each}
          </ul>
        {/if}
      </svelte:fragment>
    </OperationalTag>
  </span>
{:else}
  <TooltipDefinition
    bind:ref={buttonRef}
    {id}
    align={overflowAlign}
    direction={overflowDirection}
    class="bx--tag-set-overflow{count === 0
      ? " bx--tag-set-overflow--empty"
      : ""}"
    on:click={() => dispatch("trigger")}
  >
    <svelte:fragment slot="tooltip">
      <slot name="tooltip" {tags} {count} />
    </svelte:fragment>
    <span
      bind:this={triggerRef}
      class:bx--tag={true}
      class:bx--tag--interactive={true}
      class:bx--tag-set-overflow__popover-trigger={true}
      class:bx--tag--sm={size === "sm"}
      class:bx--tag--lg={size === "lg"}
    >
      <span aria-hidden="true">+{count}</span>
    </span>
    <span class:bx--visually-hidden={true}>{overflowLabel(count)}</span>
  </TooltipDefinition>
{/if}
