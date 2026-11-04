<script>
  /**
   * @event {null} change
   */

  /** @type {import("./table.js").ImportTable} */
  export let table;

  /** @type {ReadonlyArray<import("./schema.js").ImportField>} */
  export let fields;

  /**
   * The field key for each source column.
   * @type {Array<string | null>}
   */
  export let mapping;

  /** @type {import("./automap.js").AutoMapResult} */
  export let auto;

  /** @type {Record<string, import("./schema.js").CellTransform>} */
  export let transforms;

  /** @type {ReadonlyArray<string>} */
  export let missing = [];

  /** @type {(id: import("./import-wizard-text.js").ImportWizardTranslationId, values?: Record<string, string | number>) => string} */
  export let t;

  import { createEventDispatcher } from "svelte";
  import DataTable from "../DataTable/DataTable.svelte";
  import Dropdown from "../Dropdown/Dropdown.svelte";
  import FormGroup from "../FormGroup/FormGroup.svelte";
  import InlineNotification from "../Notification/InlineNotification.svelte";
  import Stack from "../Stack/Stack.svelte";
  import Tag from "../Tag/Tag.svelte";
  import { detectDateFormat, unmatchedValues } from "./schema.js";

  const dispatch = createEventDispatcher();
  const SKIP = "__skip";
  const KEEP = "__keep";
  const SAMPLE_ROWS = 5000;

  /** @type {Record<number, boolean>} */
  let chosen = {};
  let announcement = "";

  /** @param {number} column */
  function samplesOf(column) {
    /** @type {string[]} */
    const out = [];
    const seen = new Set();
    for (let i = 0; i < Math.min(table.rows.length, 200); i++) {
      const value = table.rows[i][column].trim();
      if (value === "" || seen.has(value)) continue;
      seen.add(value);
      out.push(value);
      if (out.length === 3) break;
    }
    return out;
  }

  /** @param {number} column */
  function columnValues(column) {
    const rows = table.rows;
    const out = [];
    for (let i = 0; i < Math.min(rows.length, SAMPLE_ROWS); i++) {
      out.push(rows[i][column]);
    }
    return out;
  }

  $: rows = table.headers.map((name, column) => ({
    id: String(column),
    name,
    samples: samplesOf(column).join(", ") || t("map.empty"),
    target: "",
    match: "",
  }));
  /** @param {typeof t} text */
  function headerList(text) {
    /** @type {any[]} */
    const list = [
      { key: "name", value: text("map.source") },
      { key: "samples", value: text("map.sample") },
      { key: "target", value: text("map.target") },
      { key: "match", value: text("map.status") },
    ];
    return list;
  }
  $: headers = headerList(t);
  $: items = [
    { id: SKIP, text: t("map.skip") },
    ...fields.map((field) => ({
      id: field.key,
      text: field.required
        ? `${field.label} (${t("map.required")})`
        : field.label,
    })),
  ];
  $: fieldByKey = new Map(fields.map((field) => [field.key, field]));

  /**
   * @param {number} column
   * @param {string} key
   */
  function choose(column, key) {
    const next = mapping.slice();
    announcement = "";
    if (key !== SKIP) {
      const other = next.indexOf(key);
      if (other !== -1 && other !== column) {
        next[other] = null;
        announcement = t("map.reassigned", {
          field: fieldByKey.get(key)?.label ?? key,
          column: table.headers[other],
        });
      }
    }
    next[column] = key === SKIP ? null : key;
    chosen = { ...chosen, [column]: true };
    mapping = next;
    dispatch("change");
  }

  /**
   * @param {number} column
   * @param {ReadonlyArray<string | null>} current
   * @param {Record<number, boolean>} picked
   * @param {import("./automap.js").AutoMapResult} guess
   * @returns {{ text: string, type: "blue" | "gray" | "green" | "teal" }}
   */
  function matchTag(column, current, picked, guess) {
    if (!current[column]) return { text: t("map.skipped"), type: "gray" };
    if (picked[column] || guess.mapping[column] !== current[column]) {
      return { text: t("map.manual"), type: "blue" };
    }
    const reason = guess.reasons[column];
    if (reason === "exact") return { text: t("map.matched"), type: "green" };
    if (reason === "alias") return { text: t("map.alias"), type: "green" };
    return {
      text: t("map.similar", { score: Math.round(guess.scores[column] * 100) }),
      type: "teal",
    };
  }

  $: needsValues = mapping.flatMap((key, column) => {
    const field = key ? fieldByKey.get(key) : undefined;
    if (!field || (field.type !== "enum" && field.type !== "boolean"))
      return [];
    const values = unmatchedValues(field, columnValues(column), 8);
    return values.length ? [{ field, values }] : [];
  });
  $: dated = mapping.flatMap((key, column) => {
    const field = key ? fieldByKey.get(key) : undefined;
    if (field?.type !== "date" || (field.dateFormats?.length ?? 0) < 2) {
      return [];
    }
    return [
      {
        field,
        selected:
          transforms[field.key]?.dateFormat ??
          detectDateFormat(field, columnValues(column)),
      },
    ];
  });

  /** @param {import("./schema.js").ImportField} field */
  function valueItems(field) {
    const options =
      field.type === "boolean"
        ? [
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]
        : (field.options ?? []).map((o) =>
            typeof o === "string" ? { value: o, label: o } : o,
          );
    return [
      { id: KEEP, text: t("map.leave") },
      ...options.map((o) => ({ id: o.value, text: o.label ?? o.value })),
    ];
  }

  /**
   * @param {import("./schema.js").ImportField} field
   * @param {string} value
   * @param {string} id
   */
  function setValue(field, value, id) {
    const valueMap = { ...transforms[field.key]?.valueMap };
    if (id === KEEP) delete valueMap[value.toLowerCase()];
    else valueMap[value.toLowerCase()] = id;
    transforms = {
      ...transforms,
      [field.key]: { ...transforms[field.key], valueMap },
    };
    dispatch("change");
  }

  /**
   * @param {import("./schema.js").ImportField} field
   * @param {string} format
   */
  function setFormat(field, format) {
    transforms = {
      ...transforms,
      [field.key]: { ...transforms[field.key], dateFormat: format },
    };
    dispatch("change");
  }
</script>

<Stack gap={6}>
  {#if missing.length}
    <InlineNotification
      hideCloseButton
      lowContrast
      kind="warning"
      title={t("map.missing", { fields: missing.join(", ") })}
    />
  {/if}
  <DataTable size="short" title={t("map.heading")} {headers} {rows}>
    <svelte:fragment slot="cell" let:cell let:row>
      {#if cell.key === "target"}
        <Dropdown
          size="sm"
          hideLabel
          type="inline"
          labelText={t("map.targetLabel", { column: row.name })}
          {items}
          selectedId={mapping[Number(row.id)] ?? SKIP}
          on:select={(event) => choose(Number(row.id), event.detail.selectedId)}
        />
      {:else if cell.key === "match"}
        <Tag
          size="sm"
          type={matchTag(Number(row.id), mapping, chosen, auto).type}
        >
          {matchTag(Number(row.id), mapping, chosen, auto).text}
        </Tag>
      {:else}
        {cell.value}
      {/if}
    </svelte:fragment>
  </DataTable>
  <div class:bx--visually-hidden={true} role="status">{announcement}</div>

  {#each dated as item (item.field.key)}
    <Dropdown
      size="sm"
      type="inline"
      labelText={t("map.dateFormat", { field: item.field.label })}
      items={(item.field.dateFormats ?? []).map((format) => ({
        id: format,
        text: format,
      }))}
      selectedId={item.selected}
      on:select={(event) => setFormat(item.field, event.detail.selectedId)}
    />
  {/each}

  {#each needsValues as item (item.field.key)}
    <FormGroup legendText={t("map.values", { field: item.field.label })}>
      <Stack gap={3}>
        {#each item.values as entry (entry.value)}
          <Dropdown
            size="sm"
            type="inline"
            labelText={`${t("map.valueTarget", { value: entry.value })} (${entry.count.toLocaleString()})`}
            items={valueItems(item.field)}
            selectedId={transforms[item.field.key]?.valueMap?.[
              entry.value.toLowerCase()
            ] ?? KEEP}
            on:select={(event) =>
              setValue(item.field, entry.value, event.detail.selectedId)}
          />
        {/each}
      </Stack>
    </FormGroup>
  {/each}
</Stack>
