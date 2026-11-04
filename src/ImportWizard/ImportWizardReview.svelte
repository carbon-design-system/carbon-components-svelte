<script>
  /**
   * @event {import("./session.js").ImportSummary} change
   */

  /** @type {ReturnType<typeof import("./session.js").createImportSession>} */
  export let session;

  /** @type {(id: import("./import-wizard-text.js").ImportWizardTranslationId, values?: Record<string, string | number>) => string} */
  export let t;

  import { createEventDispatcher, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import Checkbox from "../Checkbox/Checkbox.svelte";
  import DataTable from "../DataTable/DataTable.svelte";
  import Dropdown from "../Dropdown/Dropdown.svelte";
  import Stack from "../Stack/Stack.svelte";
  import Tag from "../Tag/Tag.svelte";
  import TextInput from "../TextInput/TextInput.svelte";
  import Close from "../icons/Close.svelte";
  import { ROW_ERROR } from "./session.js";

  const dispatch = createEventDispatcher();

  /** @type {null | { refreshRow: (id: string) => void; refreshCells: () => void }} */
  let table = null;
  /** @type {null | HTMLDivElement} */
  let container = null;
  /** @type {Map<number, Record<string, any>>} */
  let cache = new Map();

  let summary = session.summary();
  let onlyErrors = summary.errors + summary.duplicates > 0;
  let showReplace = false;
  let announcement = "";
  let replaceField = "";
  let find = "";
  let replaceWith = "";
  let whole = true;
  /** @type {any[]} */
  let rows = [];

  /** @param {number} id */
  function needsAttention(id) {
    return Object.keys(session.problems(id)).length > 0;
  }

  /** @param {number} id */
  function build(id) {
    /** @type {Record<string, any>} */
    const row = {
      id: String(id),
      n: id + session.firstRowNumber,
      p: session.problems(id),
    };
    session.fields.forEach((field, index) => {
      row[`c${index}`] =
        session.rows[id][
          /** @type {number} */ (session.columnOf.get(field.key))
        ];
    });
    return row;
  }

  /** @param {number} id */
  function rowFor(id) {
    let row = cache.get(id);
    if (!row) {
      row = build(id);
      cache.set(id, row);
    }
    return row;
  }

  function show() {
    summary = session.summary();
    const ids = [];
    for (let id = 0; id < session.rows.length; id++) {
      if (session.isRemoved(id)) continue;
      if (!onlyErrors || needsAttention(id)) ids.push(id);
    }
    rows = ids.map(rowFor);
    dispatch("change", summary);
  }

  onMount(show);

  /**
   * @param {typeof t} text
   * @param {ReadonlyArray<import("./schema.js").ImportField>} columns
   */
  function headerList(text, columns) {
    /** @type {any[]} */
    const list = [
      { key: "n", value: text("review.row") },
      ...columns.map((field, index) => ({
        key: `c${index}`,
        value: field.label,
      })),
      { key: "x", value: text("review.actions") },
    ];
    return list;
  }
  $: headers = headerList(t, session.fields);
  $: fieldCols = new Map(
    session.fields.map((field, index) => [`c${index}`, field]),
  );

  /**
   * Fix one cell, then keep the table in step with the row's new state.
   * @param {Record<string, any>} row
   * @param {string} column
   * @param {string} text
   */
  async function fix(row, column, text) {
    const field = /** @type {import("./schema.js").ImportField} */ (
      fieldCols.get(column)
    );
    const id = Number(row.id);
    session.setCell(id, field.key, text);
    summary = session.summary();
    if (field.key === session.keyField) {
      // A fixed key can free or create duplicates in other rows.
      for (const [other, cached] of cache) {
        if (other !== id) cached.p = session.problems(other);
      }
    }
    Object.assign(row, build(id));
    if (onlyErrors && !needsAttention(id)) {
      rows = rows.filter((r) => r.id !== row.id);
      announcement = t("review.fixed", { row: row.n });
      await tick();
      // The fixed row left the list, so focus would fall to the page.
      if (!container?.contains(document.activeElement)) focusNext();
    } else {
      table?.refreshCells();
    }
    dispatch("change", summary);
  }

  function focusNext() {
    const next = container?.querySelector('input[aria-invalid="true"]');
    if (next instanceof HTMLElement) next.focus();
  }

  /** @param {Record<string, any>} row */
  function removeRow(row) {
    session.removeRows([Number(row.id)]);
    rows = rows.filter((r) => r.id !== row.id);
    summary = session.summary();
    dispatch("change", summary);
    tick().then(() => {
      if (!container?.contains(document.activeElement)) focusNext();
    });
  }

  function removeErrors() {
    session.removeErrorRows();
    show();
  }

  $: attention = summary.errors + summary.duplicates;
  $: errorFields = showReplace ? fieldsWithErrors(summary) : [];
  $: if (
    errorFields.length &&
    !errorFields.some((f) => f.key === replaceField)
  ) {
    replaceField = errorFields[0].key;
  }
  $: badValues = showReplace ? badValuesOf(replaceField, summary) : [];

  /** @param {unknown} _summary - Recompute when the summary changes. */
  function fieldsWithErrors(_summary) {
    const keys = new Set();
    for (const id of session.errorIds()) {
      for (const key of Object.keys(session.problems(id))) keys.add(key);
    }
    for (const id of session.duplicateIds()) {
      for (const key of Object.keys(session.problems(id))) keys.add(key);
    }
    return session.fields.filter((field) => keys.has(field.key));
  }

  /**
   * The most common values behind the errors of a field.
   * @param {string} key
   * @param {unknown} _summary - Recompute when the summary changes.
   */
  function badValuesOf(key, _summary) {
    const column = session.columnOf.get(key);
    if (column === undefined) return [];
    /** @type {Map<string, number>} */
    const counts = new Map();
    for (const id of session.errorIds()) {
      if (!(key in session.problems(id))) continue;
      const value = session.rows[id][column];
      counts.set(value, (counts.get(value) || 0) + 1);
    }
    return [...counts]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([value]) => value);
  }

  function replaceAll() {
    const count = session.replaceInColumn(replaceField, {
      find,
      replace: replaceWith,
      whole,
    });
    cache = new Map();
    announcement = t("review.replaced", { count });
    show();
  }
</script>

<Stack gap={5}>
  <Stack gap={3} orientation="horizontal" wrap="wrap" align="center">
    <Tag type="green">{t("review.valid", { count: summary.valid })}</Tag>
    <Tag type={summary.errors ? "red" : "gray"}>
      {t("review.errors", { count: summary.errors })}
    </Tag>
    <Tag type={summary.duplicates ? "magenta" : "gray"}>
      {t("review.duplicates", { count: summary.duplicates })}
    </Tag>
    {#if summary.removed}
      <Tag type="gray">{t("review.removed", { count: summary.removed })}</Tag>
    {/if}
  </Stack>

  <Stack gap={5} orientation="horizontal" wrap="wrap" align="center">
    <Checkbox
      labelText={t("review.onlyErrors")}
      bind:checked={onlyErrors}
      on:check={show}
    />
    <Button
      kind="tertiary"
      size="small"
      disabled={attention === 0}
      aria-expanded={showReplace}
      on:click={() => (showReplace = !showReplace)}
    >
      {t("review.replace")}
    </Button>
    <Button
      kind="danger-tertiary"
      size="small"
      disabled={summary.errors === 0}
      on:click={removeErrors}
    >
      {t("review.removeErrors")}
    </Button>
  </Stack>

  {#if showReplace && errorFields.length}
    <Stack gap={4} orientation="horizontal" wrap="wrap" align="end">
      <Dropdown
        size="sm"
        labelText={t("review.replaceColumn")}
        items={errorFields.map((f) => ({ id: f.key, text: f.label }))}
        bind:selectedId={replaceField}
      />
      <TextInput
        size="sm"
        labelText={t("review.replaceFind")}
        bind:value={find}
      />
      <TextInput
        size="sm"
        labelText={t("review.replaceWith")}
        bind:value={replaceWith}
      />
      <Checkbox labelText={t("review.replaceWhole")} bind:checked={whole} />
      <Button size="small" disabled={find === ""} on:click={replaceAll}>
        {t("review.replaceApply")}
      </Button>
    </Stack>
    {#if badValues.length}
      <Stack gap={2} orientation="horizontal" wrap="wrap">
        {#each badValues as value (value)}
          <Button kind="ghost" size="small" on:click={() => (find = value)}>
            {value || t("map.empty")}
          </Button>
        {/each}
      </Stack>
    {/if}
  {/if}

  <div bind:this={container} class:bx--import-wizard__review={true}>
    {#if rows.length === 0}
      <p>{onlyErrors ? t("review.noErrors") : t("review.none")}</p>
    {:else}
      <DataTable
        bind:this={table}
        size="lg"
        stickyHeader
        title={t("review.tableLabel")}
        description={t("review.showing", {
          shown: rows.length,
          total: summary.total,
        })}
        {headers}
        {rows}
        virtualize={{ itemHeight: 64, maxVisibleRows: 7, threshold: 50 }}
      >
        <svelte:fragment slot="cell" let:cell let:row>
          {#if cell.key === "n"}
            <span class:bx--import-wizard__row-number={true}>{row.n}</span>
            {#if row.p[ROW_ERROR]}
              <span
                class:bx--import-wizard__row-error={true}
                title={row.p[ROW_ERROR]}
              >
                {row.p[ROW_ERROR]}
              </span>
            {/if}
          {:else if cell.key === "x"}
            <Button
              kind="ghost"
              size="small"
              icon={Close}
              iconDescription={t("review.removeRow", { row: row.n })}
              tooltipPosition="left"
              on:click={() => removeRow(row)}
            />
          {:else if row.p[fieldCols.get(String(cell.key))?.key ?? ""]}
            <TextInput
              size="sm"
              hideLabel
              labelText={t("review.fixLabel", {
                field: fieldCols.get(String(cell.key))?.label ?? "",
                row: row.n,
              })}
              value={String(cell.value ?? "")}
              invalid
              invalidText={row.p[fieldCols.get(String(cell.key))?.key ?? ""]}
              on:change={(event) =>
                fix(row, String(cell.key), String(event.detail ?? ""))}
            />
          {:else}
            {cell.value}
          {/if}
        </svelte:fragment>
      </DataTable>
    {/if}
  </div>
  <div class:bx--visually-hidden={true} role="status">{announcement}</div>
</Stack>
