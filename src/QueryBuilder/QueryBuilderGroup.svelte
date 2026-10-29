<script>
  /**
   * A group of a `QueryBuilder`: its logic, its rows and nested groups, and
   * the add buttons. Not exported; `QueryBuilder` renders the root.
   */

  /**
   * @type {import("./QueryBuilder.svelte").QueryGroup}
   */
  export let node;

  /** Nesting level. The root group is level 1. */
  export let depth = 1;

  /** Position among its siblings, from 0. Unused by the root. */
  export let index = 0;

  /** Number of siblings, groups included. Unused by the root. */
  export let total = 1;

  /**
   * @type {"and" | "or"}
   */
  export let groupOperator = "and";

  import { getContext } from "svelte";
  import Button from "../Button/Button.svelte";
  import OverflowMenu from "../OverflowMenu/OverflowMenu.svelte";
  import OverflowMenuItem from "../OverflowMenu/OverflowMenuItem.svelte";
  import Select from "../Select/Select.svelte";
  import SelectItem from "../Select/SelectItem.svelte";
  import Add from "../icons/Add.svelte";
  import QueryBuilderCondition from "./QueryBuilderCondition.svelte";
  // Recurses through a self-import; see `TreeViewNodeList.svelte`.
  import Self from "./QueryBuilderGroup.svelte";
  import { isQueryGroup } from "./query.js";

  /** @type {import("./query-tree.js").QueryBuilderContext} */
  const { settings, update, add, remove, move } = getContext(
    "carbon:QueryBuilder",
  );

  $: ({
    translate,
    fields,
    size,
    id,
    disabled,
    readonly,
    maxDepth,
    ariaLabel,
    labelId,
    describedBy,
  } = $settings);
  /** @type {"small" | "field"} */
  let buttonSize;
  /** @type {"sm" | undefined} */
  let selectSize;
  /** @type {"sm" | undefined} */
  let menuSize;
  let nodeId = "";

  $: nodeId = node.id ?? "";
  $: root = depth === 1;
  $: base = `${id}-${nodeId}`;
  $: buttonSize = size === "sm" ? "small" : "field";
  $: selectSize = size === "sm" ? "sm" : undefined;
  $: menuSize = size === "sm" ? "sm" : undefined;
  $: logic = translate(node.operator === "and" ? "matchAll" : "matchAny");
  $: count = node.conditions.length;
  $: connector = index === 0 ? translate("where") : translate(groupOperator);
  $: label = translate("groupLabel", { level: depth, logic, count });
  $: canNest = depth < maxDepth;
  $: canAdd = fields.length > 0;

  /** @param {string} operator */
  function setOperator(operator) {
    if (operator !== node.operator) update(nodeId, { operator });
  }
</script>

<div
  class="bx--query-builder__group"
  class:bx--query-builder__group--root={root}
  class:bx--query-builder__group--nested={!root}
  data-depth={depth}
  role="group"
  aria-label={root
    ? (ariaLabel ?? (labelId ? undefined : translate("conditions")))
    : label}
  aria-labelledby={root && !ariaLabel ? labelId : undefined}
  aria-describedby={root ? describedBy : undefined}
>
  <div class="bx--query-builder__group-header">
    <!-- The root has no group before it, so its connector column names the
      select instead. The select keeps its own hidden label. -->
    <span class="bx--query-builder__connector" aria-hidden="true"
      >{root ? translate("groupLogic") : connector}</span
    >
    <div class="bx--query-builder__cell bx--query-builder__cell--logic">
      <Select
        id="{base}-logic"
        size={selectSize}
        labelText={translate("groupLogic")}
        hideLabel
        selected={node.operator}
        {disabled}
        {readonly}
        on:update={(event) => setOperator(String(event.detail))}
      >
        <SelectItem value="and" text={translate("matchAll")} />
        <SelectItem value="or" text={translate("matchAny")} />
      </Select>
    </div>
    {#if !root && !readonly}
      <!-- One menu for the group's actions, so they do not read as the
        actions of the condition below. -->
      <div class="bx--query-builder__actions">
        <OverflowMenu
          id="{base}-menu"
          size={menuSize}
          flipped
          iconDescription={translate("groupActions", { n: index + 1 })}
          {disabled}
        >
          <OverflowMenuItem
            id="{base}-up"
            text={translate("moveGroupUp", { n: index + 1 })}
            disabled={index === 0}
            on:click={() => move(nodeId, -1)}
          />
          <OverflowMenuItem
            id="{base}-down"
            text={translate("moveGroupDown", { n: index + 1 })}
            disabled={index === total - 1}
            on:click={() => move(nodeId, 1)}
          />
          <OverflowMenuItem
            id="{base}-remove"
            text={translate("removeGroup", { n: index + 1 })}
            danger
            hasDivider
            on:click={() => remove(nodeId)}
          />
        </OverflowMenu>
      </div>
    {/if}
  </div>

  <div class="bx--query-builder__body">
    {#each node.conditions as child, position (child.id)}
      {#if isQueryGroup(child)}
        <Self
          node={child}
          depth={depth + 1}
          index={position}
          total={count}
          groupOperator={node.operator}
        />
      {:else}
        <QueryBuilderCondition
          node={child}
          index={position}
          total={count}
          groupOperator={node.operator}
        />
      {/if}
    {:else}
      <p class="bx--query-builder__empty">{translate("emptyGroup")}</p>
    {/each}
  </div>

  {#if !readonly}
    <div class="bx--query-builder__footer">
      <Button
        id="{base}-add"
        kind="ghost"
        size={buttonSize}
        icon={Add}
        disabled={disabled || !canAdd}
        on:click={() => add(nodeId, "condition")}
      >
        {translate("addCondition")}
      </Button>
      {#if canNest}
        <Button
          id="{base}-add-group"
          kind="ghost"
          size={buttonSize}
          icon={Add}
          disabled={disabled || !canAdd}
          on:click={() => add(nodeId, "group")}
        >
          {translate("addGroup")}
        </Button>
      {/if}
    </div>
  {/if}
</div>
