<script>
  /**
   * Internal. The default content of an `AddSelect` row and chosen item.
   */

  /**
   * @type {import("./AddSelect.svelte").AddSelectItem}
   */
  export let item;

  /**
   * Build the count shown on an item that can be opened.
   * @type {(count: number) => string}
   */
  export let childCountText;

  /** Set to `true` to leave out the metadata, as the chosen items do */
  export let compact = false;

  import UserAvatar from "../UserAvatar/UserAvatar.svelte";
  import { formatItemPath } from "../utils/add-select.js";

  $: pathText = formatItemPath(item.path);
</script>

{#if item.avatar}
  <span class:bx--add-select__icon={true}>
    <UserAvatar
      size="sm"
      name={item.avatar.name}
      initials={item.avatar.initials}
      image={item.avatar.image}
    />
  </span>
{:else if item.icon}
  <span class:bx--add-select__icon={true} aria-hidden="true">
    <svelte:component this={item.icon} />
  </span>
{/if}
<span class:bx--add-select__text={true}>
  <span class:bx--add-select__title-line={true}>
    <span class:bx--add-select__title={true}>{item.title}</span>
    {#if !compact}
      {#if item.hasChildren && item.childCount !== undefined}
        <span class:bx--add-select__meta={true}>
          {childCountText(item.childCount)}
        </span>
      {:else if item.meta && item.meta.length > 0}
        <span class:bx--add-select__meta={true}>{item.meta.join(" · ")}</span>
      {/if}
    {/if}
  </span>
  {#if pathText}
    <span class:bx--add-select__description={true}>{pathText}</span>
  {:else if item.description}
    <span class:bx--add-select__description={true}>{item.description}</span>
  {/if}
</span>
