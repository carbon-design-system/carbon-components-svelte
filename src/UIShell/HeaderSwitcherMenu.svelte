<script>
  /**
   * The data-driven body of `HeaderSwitcher`: current account, filter field,
   * live result count and grouped rows. Internal; use `HeaderSwitcher`.
   * @template {import("./HeaderSwitcher.svelte").HeaderSwitcherItem} [Item=import("./HeaderSwitcher.svelte").HeaderSwitcherItem]
   */

  /**
   * @type {ReadonlyArray<Item>}
   */
  export let items;

  /** @type {Item["id"] | undefined} */
  export let selectedId = undefined;

  /** @type {ReadonlyArray<Item["id"]> | undefined} */
  export let recentIds = undefined;
  export let recentLimit = 3;
  export let recentText = "Recent";

  /**
   * The id of the menu; ids inside it derive from it.
   * @type {string}
   */
  export let menuId;

  export let showDetail = false;
  export let searchThreshold = 8;
  /** @type {((item: Item, query: string) => boolean) | undefined} */
  export let filterItems = undefined;
  export let searchLabelText = "Search accounts";
  export let emptyText = "No accounts found";
  /** @type {(count: number) => string} */
  export let resultsText = (count) => `${count}`;

  import { createEventDispatcher, onMount } from "svelte";
  import { createStatusAnnouncer } from "../ListBox/menu-status.js";
  import Search from "../Search/Search.svelte";
  import UserAvatar from "../UserAvatar/UserAvatar.svelte";
  import Checkmark from "../icons/Checkmark.svelte";
  import { debounce } from "../utils/debounce.js";
  import { buildSwitcherSections } from "../utils/switcher-items.js";
  import { titleWhenTruncated } from "../utils/title-when-truncated.js";
  import ProfileMenuDivider from "./ProfileMenuDivider.svelte";
  import ProfileMenuHeader from "./ProfileMenuHeader.svelte";
  import ProfileMenuItem from "./ProfileMenuItem.svelte";

  const dispatch = createEventDispatcher();

  let query = "";

  $: selectedItem = items.find((item) => item.id === selectedId);
  $: searchable = items.length >= searchThreshold;
  $: sections = buildSwitcherSections({
    items,
    query: searchable ? query : "",
    // `LocalStorage` binds `""` before it reads a stored value.
    recentIds: Array.isArray(recentIds) ? recentIds : undefined,
    recentLimit,
    selectedId,
    recentHeading: recentText,
    matches: filterItems,
  });
  $: count = sections.reduce(
    (total, section) => total + section.items.length,
    0,
  );

  // The count is said once typing settles, as `ComboBox` says its results.
  let statusText = "";
  const announceStatus = createStatusAnnouncer((text) => (statusText = text));
  const announceCount = debounce(
    /** @param {number} total */ (total) => announceStatus(resultsText(total)),
    800,
  );
  $: if (searchable && query.trim() !== "") {
    announceCount(count);
  } else {
    announceCount.cancel();
    statusText = "";
  }
  onMount(() => () => announceCount.cancel());

  /** @param {Item} item */
  function avatarProps(item) {
    return {
      name: item.text,
      image: item.image,
      imageDescription: "",
      // The name beside the avatar says it; initials would be read too.
      "aria-hidden": /** @type {const} */ ("true"),
      backgroundColor: /** @type {const} */ ("auto"),
    };
  }
</script>

{#if showDetail && selectedItem}
  <ProfileMenuHeader
    name={selectedItem.text}
    username={selectedItem.description}
    text=""
  >
    <svelte:fragment slot="avatar">
      <UserAvatar {...avatarProps(selectedItem)} size="lg" />
    </svelte:fragment>
  </ProfileMenuHeader>
  <ProfileMenuDivider />
{/if}
{#if searchable}
  <div class:bx--header-switcher__search={true}>
    <Search
      size="sm"
      id="{menuId}-search"
      bind:value={query}
      labelText={searchLabelText}
      placeholder={searchLabelText}
      hideLabel
      on:input={() => dispatch("filter", { query })}
      on:clear={() => dispatch("filter", { query: "" })}
    />
  </div>
  <span role="status" class:bx--visually-hidden={true}>{statusText}</span>
{/if}
{#each sections as section (section.key)}
  <div
    role={section.heading ? "group" : undefined}
    aria-labelledby={section.heading ? `${menuId}-${section.key}` : undefined}
    class:bx--profile-menu__list={true}
  >
    {#if section.heading}
      <!-- Named by the group; hidden so it is not read a second time. -->
      <div
        id="{menuId}-{section.key}"
        aria-hidden="true"
        class:bx--header-switcher__group-heading={true}
      >
        {section.heading}
      </div>
    {/if}
    {#each section.items as item (item.id)}
      <ProfileMenuItem
        href={item.href}
        icon={item.id === selectedId ? Checkmark : undefined}
        aria-current={item.id === selectedId ? "true" : undefined}
        on:click={() => dispatch("pick", item)}
      >
        <svelte:fragment slot="avatar">
          <UserAvatar {...avatarProps(item)} size="sm" />
        </svelte:fragment>
        <span use:titleWhenTruncated class:bx--header-switcher__item-text={true}
          >{item.text}</span
        >
        {#if item.description}
          <span class:bx--header-switcher__item-description={true}
            >{item.description}</span
          >
        {/if}
      </ProfileMenuItem>
    {/each}
  </div>
{/each}
{#if count === 0}
  <div class:bx--header-switcher__empty={true}>{emptyText}</div>
{/if}
