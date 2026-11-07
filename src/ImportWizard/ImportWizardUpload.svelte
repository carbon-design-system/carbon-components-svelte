<script>
  /**
   * @event {File} file
   * @event {null} cancel
   * @event {null} remove
   * @event {boolean} header
   */

  /** @type {string} */
  export let id;

  /**
   * @type {null | File}
   */
  export let file = null;

  /** @type {boolean} */
  export let parsing = false;

  /** Parse progress from 0 to 1 */
  export let progress = 0;

  /** @type {string} */
  export let error = "";

  /**
   * @type {null | import("./parse-file.js").ParseFileResult}
   */
  export let parsed = null;

  /** @type {null | import("./table.js").ImportTable} */
  export let table = null;

  export let hasHeader = true;

  /** @type {ReadonlyArray<string>} */
  export let accept = [];

  /** @type {number | undefined} */
  export let maxFileSize = undefined;

  /** Set to `true` to offer a template download */
  export let template = false;

  /** @type {(id: import("./import-wizard-text.js").ImportWizardTranslationId, values?: Record<string, string | number>) => string} */
  export let t;

  import { createEventDispatcher } from "svelte";
  import Button from "../Button/Button.svelte";
  import Checkbox from "../Checkbox/Checkbox.svelte";
  import DataTable from "../DataTable/DataTable.svelte";
  import FileUploaderDropContainer from "../FileUploader/FileUploaderDropContainer.svelte";
  import FileUploaderItem from "../FileUploader/FileUploaderItem.svelte";
  import InlineNotification from "../Notification/InlineNotification.svelte";
  import ProgressBar from "../ProgressBar/ProgressBar.svelte";
  import Stack from "../Stack/Stack.svelte";

  const dispatch = createEventDispatcher();

  /** @param {CustomEvent<ReadonlyArray<File>>} event */
  function handleAdd(event) {
    const [next] = event.detail;
    if (next) dispatch("file", next);
  }

  /** @param {CustomEvent<Array<{ file: File }>>} event */
  function handleRejected(event) {
    dispatch("rejected", event.detail);
  }

  /** @param {null | import("./table.js").ImportTable} source */
  function previewOf(source) {
    /** @type {any[]} */
    const out = [];
    if (!source) return out;
    source.rows.slice(0, 5).forEach((row, index) => {
      /** @type {Record<string, string>} */
      const record = { id: String(index) };
      row.forEach((cell, column) => {
        record[`c${column}`] = cell;
      });
      out.push(record);
    });
    return out;
  }
  $: previewRows = previewOf(table);
  $: previewHeaders = table
    ? table.headers.slice(0, 8).map((value, column) => ({
        key: `c${column}`,
        value,
      }))
    : [];
  $: issues = parsed?.issues ?? [];
  $: unclosed = issues.find((issue) => issue.type === "unclosed-quote");
  $: stray = issues.filter((issue) => issue.type === "stray-quote").length;
  $: formatText = parsed
    ? parsed.format === "xlsx"
      ? t("upload.format.xlsx", { sheet: parsed.sheetName ?? "" })
      : t("upload.format.csv", {
          delimiter: t(
            parsed.delimiter === "\t"
              ? "upload.delimiter.tab"
              : parsed.delimiter === ";"
                ? "upload.delimiter.semicolon"
                : parsed.delimiter === "|"
                  ? "upload.delimiter.pipe"
                  : "upload.delimiter.comma",
          ),
          encoding: (parsed.encoding ?? "").toUpperCase(),
        })
    : "";
</script>

<Stack gap={6}>
  {#if !file}
    <FileUploaderDropContainer
      id="{id}-file"
      fullWidth
      accept={[...accept]}
      {maxFileSize}
      labelText={t("upload.dropLabel")}
      on:add={handleAdd}
      on:rejected={handleRejected}
    />
    {#if error}
      <InlineNotification
        hideCloseButton
        lowContrast
        kind="error"
        title={t("upload.failed")}
        subtitle={error}
      />
    {/if}
    {#if template}
      <div>
        <Button kind="ghost" size="small" on:click={() => dispatch("template")}>
          {t("upload.template")}
        </Button>
      </div>
    {/if}
  {:else}
    <FileUploaderItem
      id="{id}-item"
      fullWidth
      name={file.name}
      fileSize={file.size}
      status={parsing ? "uploading" : "edit"}
      iconDescription={parsing ? undefined : t("upload.remove")}
      invalid={Boolean(error)}
      errorSubject={error ? t("upload.failed") : ""}
      errorBody={error}
      on:delete={() => dispatch("remove")}
    />
    {#if parsing}
      <Stack gap={3}>
        <ProgressBar
          id="{id}-progress"
          value={Math.round(progress * 100)}
          labelText={t("upload.reading", { name: file.name })}
          size="sm"
        />
        <div>
          <Button
            kind="tertiary"
            size="small"
            on:click={() => dispatch("cancel")}
          >
            {t("upload.cancel")}
          </Button>
        </div>
      </Stack>
    {:else if table}
      {#if table.rows.length === 0}
        <InlineNotification
          hideCloseButton
          lowContrast
          kind="error"
          title={t("upload.empty")}
        />
      {:else}
        <p class:bx--import-wizard__summary={true}>
          {t("upload.summary", {
            rows: table.rows.length,
            columns: table.headers.length,
            format: formatText,
          })}
        </p>
      {/if}
      <Checkbox
        id="{id}-header"
        labelText={t("upload.header")}
        checked={hasHeader}
        on:check={(event) => dispatch("header", event.detail)}
      />
      {#if parsed?.truncated}
        <InlineNotification
          hideCloseButton
          lowContrast
          kind="warning"
          title={t("upload.truncated", { rows: table.rows.length })}
        />
      {/if}
      {#if unclosed}
        <InlineNotification
          hideCloseButton
          lowContrast
          kind="warning"
          title={t("upload.unclosedQuote", {
            row: unclosed.row + 1,
          })}
        />
      {/if}
      {#if stray}
        <InlineNotification
          hideCloseButton
          lowContrast
          kind="warning"
          title={t("upload.strayQuote", { count: stray })}
        />
      {/if}
      {#if table.short}
        <InlineNotification
          hideCloseButton
          lowContrast
          kind="info"
          title={t("upload.short", { count: table.short })}
        />
      {/if}
      {#if table.long.size}
        <InlineNotification
          hideCloseButton
          lowContrast
          kind="warning"
          title={t("upload.long", { count: table.long.size })}
        />
      {/if}
      {#if table.rows.length}
        <DataTable
          size="short"
          title={t("upload.preview")}
          headers={previewHeaders}
          rows={previewRows}
        />
      {/if}
    {/if}
  {/if}
</Stack>
