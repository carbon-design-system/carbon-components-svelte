<script context="module">
  export {
    applyColumnSettings,
    toColumnSettings,
  } from "../utils/column-settings.js";
</script>

<script>
  /**
   * @template {import("./DataTable.svelte").DataTableRow} [Row=import("./DataTable.svelte").DataTableRow]
   * @restProps {button}
   * @event change
   * @type {object}
   * @property {ReadonlyArray<import("./DataTable.svelte").DataTableHeader<Row>>} headers
   * @property {import("../utils/column-settings.js").ColumnSettings} settings
   * @event close
   * @type {object}
   * @property {"escape-key" | "outside-click" | "select"} trigger
   */

  /**
   * Bind the table's header definitions.
   * Pass the same array to `DataTable`.
   * @type {ReadonlyArray<import("./DataTable.svelte").DataTableHeader<Row>>}
   * @bindable writable
   */
  export let headers = [];

  /**
   * Restrict which columns can be toggled, by key.
   * Headers outside this list are omitted from the menu and keep their
   * current visibility. Unset (the default) makes every column toggleable.
   * @type {ReadonlyArray<string> | undefined}
   */
  export let toggleableKeys = undefined;

  /** Specify the trigger's accessible label and the menu's label. */
  export let labelText = "Column visibility";

  /**
   * Specify the menu alignment relative to the trigger.
   * @type {"start" | "end"}
   */
  export let align = "end";

  /**
   * Set to `true` to open the menu.
   * @bindable writable
   */
  export let open = false;

  /**
   * Obtain a reference to the trigger HTML element.
   * @type {null | HTMLButtonElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, getContext } from "svelte";
  import { MENU_SIZE_BY_TOOLBAR_SIZE } from "../constants/sizes.js";
  import ColumnIcon from "../icons/ColumnIcon.svelte";
  import MenuItem from "../Menu/MenuItem.svelte";
  import MenuButton from "../MenuButton/MenuButton.svelte";
  import {
    setColumnHidden,
    toColumnSettings,
  } from "../utils/column-settings.js";

  const dispatch = createEventDispatcher();
  const toolbarCtx = getContext("carbon:Toolbar") ?? {};
  const toolbarSize = toolbarCtx.toolbarSize;

  $: menuSize = MENU_SIZE_BY_TOOLBAR_SIZE[$toolbarSize ?? "default"] ?? "lg";

  $: listedHeaders = headers.filter((header) => !header.empty);
  $: toggleableHeaders = toggleableKeys
    ? listedHeaders.filter((header) => toggleableKeys.includes(header.key))
    : listedHeaders;
  $: visibleCount = listedHeaders.filter(
    (header) => !header.columnHidden,
  ).length;

  function toggle(key) {
    const header = headers.find((h) => h.key === key);
    if (!header) return;
    headers = setColumnHidden(headers, key, !header.columnHidden);
    dispatch("change", { headers, settings: toColumnSettings(headers) });
  }
</script>

<MenuButton
  bind:ref
  bind:open
  iconOnly
  icon={ColumnIcon}
  size={menuSize}
  {labelText}
  intrinsicAlign={align}
  {...$$restProps}
  class={["bx--toolbar-action", $$restProps.class].filter(Boolean).join(" ")}
  on:close
>
  {#each toggleableHeaders as header (header.key)}
    <MenuItem
      selectable
      labelText={String(header.value ?? header.key)}
      selected={!header.columnHidden}
      disabled={!header.columnHidden && visibleCount === 1}
      on:click={(event) => {
        event.preventDefault();
        toggle(header.key);
      }}
    />
  {/each}
</MenuButton>
