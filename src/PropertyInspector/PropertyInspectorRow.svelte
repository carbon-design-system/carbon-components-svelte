<script>
  /**
   * One line of the inspector: a label, one control or a pair, a reset
   * button and an aspect lock. Internal to `PropertyInspector`.
   */

  /**
   * @type {import("./build-sections.js").Row<import("./resolve-mixed.js").PropertyInspectorProperty>}
   */
  export let row;

  /**
   * @type {ReadonlyMap<string, import("./resolve-mixed.js").PropertyState>}
   */
  export let states;

  /** Specify the prefix of every id. */
  /** @type {string} */
  export let id;

  /**
   * @type {"xs" | "sm"}
   */
  export let size = "sm";

  /** Set to `true` to lock the aspect ratio of a row that has a lock. */
  export let locked = false;

  /**
   * @type {Record<string, any>}
   */
  export let widgets = {};

  /** Specify the text a mixed value shows. */
  export let mixedText = "Mixed";

  /**
   * @type {(label: string) => string}
   */
  export let resetText = (label) => `Reset ${label}`;

  /**
   * @type {(label: string) => string}
   */
  export let colorPickerText = (label) => `${label} color`;

  /**
   * @type {(locked: boolean) => string}
   */
  export let lockText = (isLocked) =>
    isLocked ? "Unlock aspect ratio" : "Lock aspect ratio";

  import { getContext, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import Locked from "../icons/Locked.svelte";
  import Undo from "../icons/Undo.svelte";
  import Unlocked from "../icons/Unlocked.svelte";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { pointerDrag } from "../utils/pointer-drag.js";
  import { titleWhenTruncated } from "../utils/title-when-truncated.js";
  import PropertyInspectorControl from "./PropertyInspectorControl.svelte";
  import { createScrub } from "./number-edit.js";

  const api = /** @type {import("./resolve-mixed.js").InspectorApi} */ (
    getContext("carbon:PropertyInspector")
  );
  const layoutDirection = getLayoutDirection();

  /** @type {null | HTMLDivElement} */
  let controlsRef = null;

  /**
   * @param {string} value
   */
  function safe(value) {
    return value.replace(/\s+/g, "_");
  }

  $: pair = row.properties.length > 1;
  $: labelId = `${id}-${safe(row.id)}-label`;
  $: rowStates = row.properties.map(
    (property) =>
      /** @type {import("./resolve-mixed.js").PropertyState} */ (
        states.get(property.id)
      ),
  );
  $: modifiedIds = row.properties
    .filter((_property, index) => rowStates[index]?.modified)
    .map((property) => property.id);
  $: modified = modifiedIds.length > 0;
  $: canLock = row.properties.some((property) => property.lockWith);
  $: single = pair ? undefined : row.properties[0];
  $: singleState = pair ? undefined : rowStates[0];

  /** Scrub state per property, which survives the options object being rebuilt. */
  const scrubs = new Map();
  let scrubX = 0;

  /**
   * @param {import("./resolve-mixed.js").PropertyInspectorProperty} property
   * @param {import("./resolve-mixed.js").PropertyState | undefined} state
   */
  function scrubbable(property, state) {
    return property.type === "number" && !!state && !state.readOnly;
  }

  /**
   * @param {import("./resolve-mixed.js").PropertyInspectorProperty} property
   * @param {import("./resolve-mixed.js").PropertyState | undefined} state
   */
  function scrubOptions(property, state) {
    return {
      enabled: scrubbable(property, state),
      /** @param {PointerEvent} event */
      onStart(/** @type {PointerEvent} */ event) {
        // Keep the press from selecting the label text; a click without
        // movement still focuses the control.
        event.preventDefault();
        const node =
          event.currentTarget instanceof Element ? event.currentTarget : null;
        scrubX = event.clientX;
        scrubs.set(
          property.id,
          createScrub({
            step: property.step ?? 1,
            sign:
              resolveLayoutDirection($layoutDirection, node) === "rtl" ? -1 : 1,
          }),
        );
        api.start(property.id, "scrub");
      },
      /** @param {PointerEvent} event */
      onMove(event) {
        const scrub = scrubs.get(property.id);
        if (!scrub) return;
        const total = scrub.move(event.clientX - scrubX, event);
        scrubX = event.clientX;
        api.update(property.id, { kind: "add", n: total });
      },
      onEnd() {
        scrubs.delete(property.id);
        api.end(property.id);
      },
    };
  }

  function focusControl() {
    /** @type {null | undefined | HTMLElement} */ (
      controlsRef?.querySelector(
        "input:not([type=hidden]):not(:disabled), select, [role=combobox]",
      )
    )?.focus();
  }

  async function handleReset() {
    api.reset(modifiedIds);
    await tick();
    focusControl();
  }

  /** @param {import("./resolve-mixed.js").PropertyInspectorProperty} property */
  function controlId(property) {
    return `${id}-${safe(property.id)}`;
  }
</script>

<div
  class:bx--property-inspector__row={true}
  class:bx--property-inspector__row--pair={pair}
  class:bx--property-inspector__row--modified={modified}
  class:bx--property-inspector__row--readonly={rowStates.every(
    (state) => state?.readOnly,
  )}
  role={pair ? "group" : undefined}
  aria-labelledby={pair ? labelId : undefined}
  data-property={row.id}
>
  <div class:bx--property-inspector__label-cell={true}>
    {#if single}
      <!-- The control carries the accessible name; this text is its visible
        label, and the handle a drag scrubs. -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <span
        id={labelId}
        class:bx--property-inspector__label={true}
        class:bx--label--scrubbable={scrubbable(single, singleState)}
        aria-hidden="true"
        use:titleWhenTruncated
        use:pointerDrag={scrubOptions(single, singleState)}
        on:click={focusControl}>{row.label}</span
      >
    {:else}
      <span id={labelId} class:bx--property-inspector__label={true}
        >{row.label}</span
      >
    {/if}
    {#if modified}
      <span class:bx--property-inspector__reset={true}>
        <Button
          kind="ghost"
          size="xs"
          icon={Undo}
          iconDescription={resetText(row.label)}
          aria-pressed={undefined}
          tooltipPosition="bottom"
          tooltipAlignment="start"
          on:click={handleReset}
        />
      </span>
    {/if}
  </div>
  <div bind:this={controlsRef} class:bx--property-inspector__controls={true}>
    {#each row.properties as property, index (property.id)}
      {@const state = rowStates[index]}
      <div
        class:bx--property-inspector__field={true}
        class:bx--property-inspector__field--inline={pair}
        class:bx--property-inspector__field--number={property.type === "number"}
      >
        {#if pair}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <span
            class:bx--property-inspector__prefix={true}
            class:bx--label--scrubbable={scrubbable(property, state)}
            aria-hidden="true"
            use:pointerDrag={scrubOptions(property, state)}
            >{property.label}</span
          >
        {/if}
        {#if state}
          <PropertyInspectorControl
            {property}
            {state}
            {size}
            {widgets}
            {mixedText}
            inline={pair}
            id={controlId(property)}
            name={pair ? `${row.label} ${property.label}` : property.label}
            colorPickerText={colorPickerText(property.label)}
          />
        {/if}
      </div>
    {/each}
    {#if canLock}
      <span class:bx--property-inspector__lock={true}>
        <Button
          kind="ghost"
          size="xs"
          icon={locked ? Locked : Unlocked}
          iconDescription={lockText(locked)}
          isSelected={locked}
          tooltipPosition="bottom"
          tooltipAlignment="end"
          on:click={() => api.toggleLock(row.id)}
        />
      </span>
    {/if}
  </div>
</div>
