<script>
  /**
   * @typedef {import("./resolve-mixed.js").PropertyOption} PropertyOption
   * @typedef {import("./resolve-mixed.js").PropertyInspectorProperty} PropertyInspectorProperty
   * @typedef {import("./resolve-mixed.js").PropertyEdit} PropertyEdit
   */

  /**
   * @typedef {object} PropertyInspectorGroup
   * @property {string} id
   * @property {string} [label]
   * @property {boolean} [open] - Set to `false` to start the group collapsed.
   */

  /**
   * @typedef {object} PropertyInspectorChange
   * @property {any} target - The object.
   * @property {unknown} targetId - Its `idOf` id.
   * @property {string} property
   * @property {unknown} oldValue - The value before the edit began. For a drag, before the first move.
   * @property {unknown} newValue
   */

  /**
   * @typedef {object} PropertyInspectorChangeDetail
   * @property {"input" | "key" | "scrub" | "reset"} source - How the value changed.
   * @property {number} transaction - Counts up. A drag and its `change` share one.
   * @property {string} property - The property that was edited.
   * @property {PropertyInspectorChange[]} changes
   */

  /**
   * @restProps {div}
   * @event {PropertyInspectorChangeDetail} input - Fires for every value on the way: each key press, drag step and picked color. `newValue` is the latest value of every object, so applying it keeps the canvas live.
   * @event {PropertyInspectorChangeDetail} change - Fires once when an edit is done: when a drag is released, a key is let go, a field is committed, or a reset is clicked. `oldValue` is the value before the edit began, so `change` is one undo step.
   */

  /**
   * Specify the properties to edit, in display order.
   * @type {PropertyInspectorProperty[]}
   */
  export let properties = [];

  /**
   * Specify the selected objects.
   * Reassign it when an object changes: the inspector does not watch inside
   * the objects.
   * @type {any[]}
   */
  export let selection = [];

  /**
   * Read one object's value for a property.
   * @type {(target: any, property: string) => unknown}
   */
  export let getValue = function getValue(target, property) {
    return target?.[property];
  };

  /**
   * Read one object's default, which wins over the property's `default`.
   * @type {((target: any, property: string) => unknown) | undefined}
   */
  export let getDefault = undefined;

  /**
   * Read an object's id, which change events carry.
   * @type {(target: any) => unknown}
   */
  export let idOf = function idOf(target) {
    return target?.id;
  };

  /**
   * Compare two values. Defaults to deep equality.
   * @type {((a: unknown, b: unknown) => boolean) | undefined}
   */
  export let equals = undefined;

  /**
   * Show a property when every selected object has it (`"all"`) or when
   * any does (`"any"`). An edit reaches only the objects that have it.
   * @type {"all" | "any"}
   */
  export let scope = "all";

  /**
   * Filter the properties by label, id, group and keywords.
   * @bindable writable
   */
  export let search = "";

  /**
   * Specify the groups, in order, with their headings.
   * A property whose `group` is not listed gets a group named after it.
   * @type {Array<string | PropertyInspectorGroup> | undefined}
   */
  export let groups = undefined;

  /**
   * Specify the density of the rows. `"sm"` rows are 32px and `"xs"` 24px.
   * @type {"xs" | "sm"}
   */
  export let size = "sm";

  /**
   * Specify the heading level of the group names.
   * @type {1 | 2 | 3 | 4 | 5 | 6}
   */
  export let headingLevel = 3;

  /**
   * Specify the accessible name of the inspector.
   */
  export let labelText = "Properties";

  /**
   * Set which rows keep their aspect ratio, by row id.
   * @type {Record<string, boolean>}
   * @bindable writable
   */
  export let locked = {};

  /**
   * Add controls, or replace the built-in one, by `type`. A control gets
   * `property`, `state`, `id`, `name`, `size`, `mixedText`, `readOnly`, and
   * the functions `start(source)`, `update(edit)`, `end()` and `commit(value)`.
   * @type {Record<string, any>}
   */
  export let widgets = {};

  /** Set to `true` to hide the search field. */
  export let hideSearch = false;

  /** Specify the text a mixed value shows. */
  export let mixedText = "Mixed";

  /** Specify the label of the search field. */
  export let searchLabelText = "Search properties";

  /** Specify the placeholder of the search field. */
  export let searchPlaceholder = "Search properties";

  /**
   * Specify the summary of the selection.
   * @type {(count: number, selection: any[]) => string}
   */
  export let selectionText = function selectionText(count) {
    if (count === 0) return "Nothing selected";
    return count === 1 ? "1 object selected" : `${count} objects selected`;
  };

  /** Specify the text shown with no selection. */
  export let emptyText = "Select an object to see its properties.";

  /** Specify the text shown when the search matches nothing. */
  export let noResultsText = "No properties match.";

  /**
   * Specify the count announced when the search changes.
   * @type {(count: number) => string}
   */
  export let resultsText = function resultsText(count) {
    return count === 1 ? "1 property" : `${count} properties`;
  };

  /**
   * Specify the name of a row's reset button.
   * @type {(label: string) => string}
   */
  export let resetText = function resetText(label) {
    return `Reset ${label}`;
  };

  /**
   * Specify the name of a color property's swatch.
   * @type {(label: string) => string}
   */
  export let colorPickerText = function colorPickerText(label) {
    return `${label} color`;
  };

  /**
   * Specify the name of the aspect ratio lock.
   * @type {(locked: boolean) => string}
   */
  export let lockText = function lockText(isLocked) {
    return isLocked ? "Unlock aspect ratio" : "Lock aspect ratio";
  };

  /** Specify the id the inner ids derive from. */
  export let id = uniqueId();

  import { createEventDispatcher, setContext } from "svelte";
  import Search from "../Search/Search.svelte";
  import ChevronRight from "../icons/ChevronRight.svelte";
  import { uniqueId } from "../utils/unique-id.js";
  import PropertyInspectorRow from "./PropertyInspectorRow.svelte";
  import { buildSections, queryTokens } from "./build-sections.js";
  import { applyNumberEdit, scaleLinked } from "./number-edit.js";
  import {
    createGesture,
    editableTargets,
    resolveProperties,
  } from "./resolve-mixed.js";

  const dispatch = createEventDispatcher();

  /**
   * The states of the last resolve, which the next one reuses.
   * @type {{ states: Map<string, import("./resolve-mixed.js").PropertyState> }}
   */
  const memo = { states: new Map() };

  /**
   * @param {any[]} targets
   * @param {PropertyInspectorProperty[]} props
   * @param {typeof getValue} read
   * @param {typeof getDefault} readDefault
   * @param {typeof equals} compare
   * @param {typeof scope} mode
   */
  function resolve(targets, props, read, readDefault, compare, mode) {
    memo.states = resolveProperties(
      targets,
      props,
      { getValue: read, getDefault: readDefault, equals: compare, scope: mode },
      memo.states,
    );
    return memo.states;
  }

  $: states = resolve(
    selection,
    properties,
    getValue,
    getDefault,
    equals,
    scope,
  );
  $: byId = new Map(properties.map((property) => [property.id, property]));
  $: sections = buildSections(properties, states, { query: search, groups });
  $: searching = queryTokens(search).length > 0;
  $: shownCount = sections.reduce((total, section) => total + section.count, 0);

  /** @type {Record<string, boolean>} */
  let closed = {};
  for (const group of groups ?? []) {
    if (typeof group !== "string" && group.open === false) {
      closed[group.id] = true;
    }
  }

  // A closed group builds its rows the first time it opens, then keeps them.
  const builtOnce = new Set();

  /**
   * @param {Array<{ id: string }>} list
   * @param {boolean} filtering
   * @param {Record<string, boolean>} collapsed
   */
  function markBuilt(list, filtering, collapsed) {
    for (const section of list) {
      if (filtering || !collapsed[section.id]) builtOnce.add(section.id);
    }
  }

  $: markBuilt(sections, searching, closed);

  /** @param {string} groupId */
  function toggleGroup(groupId) {
    closed = { ...closed, [groupId]: !closed[groupId] };
  }

  /** @param {string} value */
  function safe(value) {
    return value.replace(/\s+/g, "_");
  }

  // Edits

  /**
   * @typedef {object} ActiveEdit
   * @property {PropertyInspectorProperty} property
   * @property {PropertyInspectorProperty | undefined} partner
   * @property {"input" | "key" | "scrub"} source
   * @property {number} transaction
   * @property {ReturnType<typeof import("./resolve-mixed.js").createGesture>} gesture
   * @property {Map<any, unknown>} primaryFrom
   */

  /** @type {ActiveEdit | null} */
  let active = null;
  let transactions = 0;

  /**
   * The property whose ratio `property` keeps, when its row is locked.
   * @param {PropertyInspectorProperty} property
   */
  function lockedPartner(property) {
    if (!property.row || !locked[property.row]) return undefined;
    if (property.lockWith) return byId.get(property.lockWith);
    return properties.find(
      (other) => other.row === property.row && other.lockWith === property.id,
    );
  }

  /**
   * @param {PropertyInspectorProperty | undefined} property
   */
  function limitsOf(property) {
    return {
      min: property?.min,
      max: property?.max,
      step: property?.step,
    };
  }

  /**
   * @param {ActiveEdit} edit
   * @param {{ target: any; property: string; from: unknown }} entry
   * @param {PropertyEdit} change
   */
  function valueFor(edit, entry, change) {
    if (change.kind === "set" && change.n === undefined) return change.value;
    const own =
      entry.property === edit.property.id ? edit.property : edit.partner;
    const primaryFrom = Number(edit.primaryFrom.get(entry.target)) || 0;
    const primaryTo = applyNumberEdit(
      /** @type {import("./number-edit.js").NumberEdit} */ (change),
      primaryFrom,
      limitsOf(edit.property),
    );
    if (own === edit.property) return primaryTo;
    const scaled = scaleLinked(primaryFrom, primaryTo, Number(entry.from) || 0);
    return applyNumberEdit({ kind: "set", n: scaled }, scaled, limitsOf(own));
  }

  /**
   * @param {"input" | "change"} type
   * @param {ActiveEdit} edit
   * @param {PropertyInspectorChange[]} changes
   */
  function emit(type, edit, changes) {
    dispatch(type, {
      source: edit.source,
      transaction: edit.transaction,
      property: edit.property.id,
      changes,
    });
  }

  /**
   * @param {string} propertyId
   * @param {"input" | "key" | "scrub"} source
   */
  function start(propertyId, source) {
    end();
    const property = byId.get(propertyId);
    if (!property) return;
    const partner = lockedPartner(property);
    /** @type {Array<{ target: any; targetId: unknown; property: string; from: unknown }>} */
    const entries = [];
    /** @type {Map<any, unknown>} */
    const primaryFrom = new Map();
    for (const target of editableTargets(selection, property)) {
      const targetId = idOf(target);
      const from = getValue(target, property.id);
      primaryFrom.set(target, from);
      entries.push({ target, targetId, property: property.id, from });
      if (partner && (!partner.appliesTo || partner.appliesTo(target))) {
        entries.push({
          target,
          targetId,
          property: partner.id,
          from: getValue(target, partner.id),
        });
      }
    }
    active = {
      property,
      partner,
      source,
      transaction: ++transactions,
      gesture: createGesture(entries),
      primaryFrom,
    };
  }

  /**
   * @param {string} propertyId
   * @param {PropertyEdit} change
   */
  function update(propertyId, change) {
    if (!active || active.property.id !== propertyId)
      start(propertyId, "input");
    const edit = /** @type {ActiveEdit} */ (active);
    const changes = edit.gesture.update((entry) =>
      valueFor(edit, entry, change),
    );
    if (changes) emit("input", edit, changes);
  }

  /** @param {string} [propertyId] */
  function end(propertyId) {
    const edit = active;
    if (!edit || (propertyId && edit.property.id !== propertyId)) return;
    active = null;
    const changes = edit.gesture.changes();
    if (changes.length) emit("change", edit, changes);
  }

  /**
   * @param {string} propertyId
   * @param {PropertyEdit} change
   * @param {"input" | "key" | "scrub"} source
   */
  function commit(propertyId, change, source) {
    start(propertyId, source);
    update(propertyId, change);
    end(propertyId);
  }

  /** @param {string[]} propertyIds */
  function reset(propertyIds) {
    end();
    /** @type {Array<{ target: any; targetId: unknown; property: string; from: unknown }>} */
    const entries = [];
    /** @type {Map<string, PropertyInspectorProperty>} */
    const touched = new Map();
    for (const propertyId of propertyIds) {
      const property = byId.get(propertyId);
      if (!property) continue;
      touched.set(propertyId, property);
      for (const target of editableTargets(selection, property)) {
        entries.push({
          target,
          targetId: idOf(target),
          property: propertyId,
          from: getValue(target, propertyId),
        });
      }
    }
    if (!entries.length) return;
    const gesture = createGesture(entries);
    const changes = gesture.update((entry) =>
      getDefault
        ? getDefault(entry.target, entry.property)
        : touched.get(entry.property)?.default,
    );
    const moved = gesture.changes();
    if (changes && moved.length) {
      const detail = {
        source: "reset",
        transaction: ++transactions,
        property: entries[0].property,
      };
      dispatch("input", { ...detail, changes });
      dispatch("change", { ...detail, changes: moved });
    }
  }

  /** @param {string} rowId */
  function toggleLock(rowId) {
    locked = { ...locked, [rowId]: !locked[rowId] };
  }

  setContext(
    "carbon:PropertyInspector",
    /** @type {import("./resolve-mixed.js").InspectorApi} */ ({
      start,
      update,
      end,
      commit,
      reset,
      toggleLock,
    }),
  );
</script>

<div
  class:bx--property-inspector={true}
  class:bx--property-inspector--xs={size === "xs"}
  class:bx--property-inspector--sm={size !== "xs"}
  role="group"
  aria-label={labelText}
  {id}
  {...$$restProps}
>
  <div class:bx--property-inspector__header={true}>
    <p class:bx--property-inspector__summary={true} role="status">
      {selectionText(selection.length, selection)}
    </p>
    {#if !hideSearch && selection.length > 0}
      <Search
        bind:value={search}
        size={size === "xs" ? "xs" : "sm"}
        labelText={searchLabelText}
        placeholder={searchPlaceholder}
        autocomplete="off"
      />
    {/if}
  </div>
  {#if searching}
    <span class:bx--visually-hidden={true} role="status"
      >{resultsText(shownCount)}</span
    >
  {/if}
  {#if selection.length === 0}
    <div class:bx--property-inspector__empty={true}>
      <slot name="empty">{emptyText}</slot>
    </div>
  {:else if sections.length === 0}
    <div class:bx--property-inspector__empty={true}>{noResultsText}</div>
  {:else}
    {#each sections as section (section.id)}
      {@const open = searching || !closed[section.id]}
      {@const groupId = `${id}-group-${safe(section.id)}`}
      <div
        class:bx--property-inspector__group={true}
        class:bx--property-inspector__group--open={open}
        role={section.label ? "group" : undefined}
        aria-labelledby={section.label ? `${groupId}-heading` : undefined}
      >
        {#if section.label}
          <svelte:element
            this={`h${headingLevel}`}
            id="{groupId}-heading"
            class:bx--property-inspector__heading={true}
          >
            <button
              type="button"
              class:bx--property-inspector__toggle-button={true}
              aria-expanded={open}
              aria-controls="{groupId}-rows"
              on:click={() => toggleGroup(section.id)}
            >
              <ChevronRight class="bx--property-inspector__chevron" />
              <span class:bx--property-inspector__group-name={true}
                >{section.label}</span
              >
            </button>
          </svelte:element>
        {/if}
        {#if open || builtOnce.has(section.id)}
          <div
            id="{groupId}-rows"
            class:bx--property-inspector__rows={true}
            hidden={!open}
          >
            {#each section.rows as row (row.id)}
              <PropertyInspectorRow
                {row}
                {states}
                {size}
                {widgets}
                {mixedText}
                {resetText}
                {colorPickerText}
                {lockText}
                id="{id}-{safe(section.id)}"
                locked={!!locked[row.id]}
              />
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  {/if}
</div>
