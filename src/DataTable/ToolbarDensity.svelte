<script>
  /**
   * @template [Icon=any]
   */

  /**
   * @event change
   * @type {object}
   * @property {"compact" | "short" | "medium" | "tall"} size
   * @event {null} close
   */

  /**
   * Specify the row height.
   * Pass this value to the `DataTable`'s `size` prop.
   * When unset, the checked item mirrors the parent table's size,
   * falling back to `"medium"`.
   * @type {"compact" | "short" | "medium" | "tall" | undefined}
   * @bindable writable
   */
  export let size = undefined;

  /**
   * Specify the icon to render in the trigger.
   * @type {Icon}
   */
  export let icon = /** @type {Icon} */ (RowExpand);

  /**
   * Specify the sizes to offer and their order.
   * @type {ReadonlyArray<"compact" | "short" | "medium" | "tall">}
   */
  export let sizes = ["compact", "short", "medium", "tall"];

  /**
   * Specify a function to format the item text for a size.
   * @type {(size: "compact" | "short" | "medium" | "tall") => string}
   */
  export let formatLabel = (value) => value[0].toUpperCase() + value.slice(1);

  /**
   * Specify the trigger's accessible name and the radio group label.
   */
  export let labelText = "Row height";

  /**
   * Set the preferred direction the menu opens toward.
   * @type {"top" | "bottom"}
   */
  export let direction = "bottom";

  /**
   * Set to `true` to open the menu.
   * @bindable writable
   */
  export let open = false;

  import { createEventDispatcher, getContext } from "svelte";
  import RowExpand from "../icons/RowExpand.svelte";
  import MenuItem from "../Menu/MenuItem.svelte";
  import MenuItemRadioGroup from "../Menu/MenuItemRadioGroup.svelte";
  import MenuButton from "../MenuButton/MenuButton.svelte";

  const dispatch = createEventDispatcher();

  const ctx = getContext("carbon:DataTable");
  const tableSize = ctx?.tableSize;

  $: selectedId = size ?? $tableSize ?? "medium";
  $: menuSize =
    $tableSize === "compact" ? "xs" : $tableSize === "short" ? "sm" : "md";

  /**
   * @type {(nextSize: "compact" | "short" | "medium" | "tall") => void}
   */
  function handleSelect(nextSize) {
    size = nextSize;
    dispatch("change", { size: nextSize });
  }
</script>

<MenuButton
  iconOnly
  {icon}
  {labelText}
  size={menuSize}
  {direction}
  bind:open
  class="bx--toolbar-action"
  {...$$restProps}
  on:close
>
  <MenuItemRadioGroup {labelText} {selectedId}>
    {#each sizes as item (item)}
      <MenuItem
        id={item}
        labelText={formatLabel(item)}
        on:click={() => handleSelect(item)}
      />
    {/each}
  </MenuItemRadioGroup>
</MenuButton>
