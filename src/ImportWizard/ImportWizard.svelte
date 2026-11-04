<script>
  /**
   * @restProps {div}
   * @event {import("./session.js").ImportResult} complete - The import finished, was canceled, or stopped.
   * @event {import("./parse-file.js").ParseFileResult} parse - A file was read.
   */

  /**
   * @typedef {import("./schema.js").ImportField} ImportWizardField
   * @typedef {import("./schema.js").ImportMessages} ImportWizardMessages
   * @typedef {import("./session.js").ImportResult} ImportWizardResult
   * @typedef {import("./session.js").ImportContext} ImportWizardContext
   * @typedef {import("./import-wizard-text.js").ImportWizardTranslationId} ImportWizardTranslationId
   */

  /**
   * Describe the target schema: the fields a row can have. Each takes
   * `key`, `label`, `type`, `required`, `aliases` and the rules of its type
   * (see `ImportWizardField`).
   * @type {ReadonlyArray<ImportWizardField>}
   */
  export let fields = [];

  /**
   * Receive the valid rows, one chunk at a time. Resolve when the chunk is
   * stored; throw to fail every row of the chunk; or resolve
   * `{ errors: [{ index, message }] }` to fail single rows. `signal` aborts
   * when the user cancels.
   * @type {undefined | ((records: Array<Record<string, any>>, context: ImportWizardContext) => void | { errors?: ReadonlyArray<{ index: number; message: string }> } | Promise<void | { errors?: ReadonlyArray<{ index: number; message: string }> }>)}
   */
  export let onImport = undefined;

  /**
   * Specify the key of the field that identifies a row. A later row with the
   * same value is a duplicate of the first.
   * @type {string | undefined}
   */
  export let keyField = undefined;

  /**
   * Specify what happens to duplicate rows: `"skip"` leaves them out and
   * counts them, `"error"` treats them as errors to fix, and `"keep"`
   * imports them.
   * @type {"skip" | "error" | "keep"}
   */
  export let duplicates = "skip";

  /**
   * Specify the accepted file types.
   * @type {ReadonlyArray<string>}
   */
  export let accept = [".csv", ".tsv", ".txt", ".xlsx"];

  /**
   * Specify the largest file size in bytes.
   * @type {number | undefined}
   */
  export let maxFileSize = undefined;

  /** Specify the most rows to read. The rest of the file is ignored. */
  export let maxRows = 1_000_000;

  /**
   * Specify where the file is parsed. `"auto"` uses an inline Web Worker
   * and falls back to the main thread; `false` stays on the main thread; a
   * function returns your own `Worker`, for a page whose CSP blocks `blob:`
   * workers.
   * @type {false | "auto" | (() => Worker)}
   */
  export let worker = "auto";

  /** Specify how many rows each `onImport` call receives */
  export let chunkSize = 500;

  /** Set to `true` to stop after the first chunk that fails */
  export let stopOnError = false;

  /** Set to `false` if the first row of the file is data */
  export let hasHeader = true;

  /**
   * Set an id for the wizard. The ids inside it derive from this one.
   * @type {string | undefined}
   */
  export let id = undefined;

  /**
   * Specify the index of the current step.
   * @bindable writable
   */
  export let currentIndex = 0;

  /**
   * Replace the validation messages.
   * @type {Partial<ImportWizardMessages> | undefined}
   */
  export let messages = undefined;

  /**
   * Check a whole row after its cells passed. Return a message, or an object
   * of messages by field key.
   * @type {undefined | ((record: Record<string, any>, index: number) => string | Record<string, string> | null | undefined | void)}
   */
  export let validateRow = undefined;

  /** Set to `false` to hide the link that downloads a CSV template */
  export let template = true;

  /**
   * Override the default text. Called with an id such as `"step.map"` and
   * the values to fill in.
   * @type {(id: ImportWizardTranslationId, values?: Record<string, string | number>) => string}
   */
  export let translateWithId = defaultTranslate;

  import { createEventDispatcher } from "svelte";
  import Button from "../Button/Button.svelte";
  import { toCsv } from "../DataTable/data-table-utils.js";
  import InlineNotification from "../Notification/InlineNotification.svelte";
  import ProgressBar from "../ProgressBar/ProgressBar.svelte";
  import Stack from "../Stack/Stack.svelte";
  import Stepper from "../Stepper/Stepper.svelte";
  import { downloadFile } from "../utils/download-file.js";
  import { uniqueId } from "../utils/unique-id.js";
  import ImportWizardMap from "./ImportWizardMap.svelte";
  import ImportWizardReview from "./ImportWizardReview.svelte";
  import ImportWizardUpload from "./ImportWizardUpload.svelte";
  import { autoMap } from "./automap.js";
  import { defaultTranslate } from "./import-wizard-text.js";
  import { parseFile } from "./parse-file.js";
  import { detectDateFormat } from "./schema.js";
  import { createImportSession } from "./session.js";
  import { toTable } from "./table.js";

  const dispatch = createEventDispatcher();
  const fallbackId = uniqueId();
  $: baseId = id ?? fallbackId;

  /** @type {null | File} */
  let file = null;
  let parsing = false;
  let progress = 0;
  let error = "";
  /** @type {null | import("./parse-file.js").ParseFileResult} */
  let parsed = null;
  /** @type {null | AbortController} */
  let parseAbort = null;

  /** @type {Array<string | null>} */
  let mapping = [];
  /** @type {import("./automap.js").AutoMapResult} */
  let auto = { mapping: [], scores: [], reasons: [] };
  /** @type {Record<string, import("./schema.js").CellTransform>} */
  let transforms = {};
  /** @type {null | import("./table.js").ImportTable} */
  let mappedTable = null;

  /** @type {null | ReturnType<typeof createImportSession>} */
  let session = null;
  let signature = "";
  /** @type {null | import("./session.js").ImportSummary} */
  let summary = null;

  let submitted = false;
  let importing = false;
  /** @type {null | AbortController} */
  let importAbort = null;
  let importProgress = { done: 0, total: 0, failed: 0 };
  /** @type {null | import("./session.js").ImportResult} */
  let result = null;
  let canceling = false;

  $: t = translateWithId;
  $: table = parsed ? toTable(parsed.rows, { hasHeader }) : null;
  $: syncMapping(table);
  $: missing = fields
    .filter((field) => field.required && !mapping.includes(field.key))
    .map((field) => field.label);

  /** @param {null | import("./table.js").ImportTable} next */
  function syncMapping(next) {
    if (next === mappedTable) return;
    mappedTable = next;
    session = null;
    signature = "";
    summary = null;
    transforms = {};
    auto = next
      ? autoMap(next.headers, fields)
      : { mapping: [], scores: [], reasons: [] };
    mapping = auto.mapping.slice();
  }

  /** @param {File} next */
  async function loadFile(next) {
    parseAbort?.abort();
    const controller = new AbortController();
    parseAbort = controller;
    file = next;
    parsed = null;
    error = "";
    parsing = true;
    progress = 0;
    try {
      const output = await parseFile(next, {
        worker,
        maxRows: maxRows + 1,
        signal: controller.signal,
        onProgress: ({ loaded, total }) => {
          const next = total ? loaded / total : 0;
          if (next - progress >= 0.01 || next === 1) progress = next;
        },
      });
      if (controller !== parseAbort) return;
      parsed = output;
      dispatch("parse", output);
    } catch (reason) {
      if (controller !== parseAbort) return;
      if (/** @type {Error} */ (reason)?.name === "AbortError") file = null;
      else error = reason instanceof Error ? reason.message : String(reason);
    } finally {
      if (controller === parseAbort) parsing = false;
    }
  }

  function clearFile() {
    parseAbort?.abort();
    parseAbort = null;
    file = null;
    parsed = null;
    parsing = false;
    error = "";
  }

  /** @param {string} name */
  function rejectFile(name) {
    error = t("upload.rejected", { name });
  }

  function downloadTemplate() {
    downloadFile(
      `﻿${toCsv(
        fields.map((field) => ({ key: field.key, value: field.label })),
        [],
        { includeHeaders: true },
      )}`,
      "import-template.csv",
      "text/csv;charset=utf-8",
    );
  }

  /** Check every row, unless the mapping and the rows haven't changed. */
  async function build() {
    if (!table) return false;
    const current = table;
    /** @type {Record<string, import("./schema.js").CellTransform>} */
    const resolved = { ...transforms };
    mapping.forEach((key, column) => {
      const field = fields.find((f) => f.key === key);
      if (field?.type === "date" && !resolved[field.key]?.dateFormat) {
        const format = detectDateFormat(
          field,
          current.rows.slice(0, 5000).map((row) => row[column]),
        );
        if (format)
          resolved[field.key] = { ...resolved[field.key], dateFormat: format };
      }
    });
    const next = JSON.stringify([
      mapping,
      resolved,
      hasHeader,
      duplicates,
      keyField,
      file?.name,
      file?.size,
    ]);
    if (session && next === signature) return true;
    const fresh = createImportSession({
      fields,
      headers: current.headers,
      rows: current.rows,
      long: current.long,
      mapping,
      transforms: resolved,
      keyField,
      duplicates,
      messages,
      validateRow,
      firstRowNumber: hasHeader ? 2 : 1,
    });
    await fresh.validate();
    session = fresh;
    signature = next;
    summary = fresh.summary();
    return true;
  }

  /** @param {number} index */
  function validate(index) {
    if (index === 1) return build();
    if (index === 2) return Boolean(summary && summary.valid > 0);
    return true;
  }

  async function runImport() {
    if (!session) return;
    const controller = new AbortController();
    importAbort = controller;
    canceling = false;
    importing = true;
    importProgress = { done: 0, total: summary?.valid ?? 0, failed: 0 };
    try {
      result = await session.run(onImport ?? (() => {}), {
        chunkSize,
        stopOnError,
        signal: controller.signal,
        onProgress: (value) => {
          importProgress = value;
        },
      });
    } finally {
      importing = false;
    }
    dispatch("complete", result);
  }

  function cancelImport() {
    canceling = true;
    importAbort?.abort();
  }

  function downloadErrors() {
    if (!session) return;
    const report = session.report(result ?? undefined);
    downloadFile(
      `﻿${toCsv(
        report.headers.map((value, index) => ({ key: `c${index}`, value })),
        report.rows.map((row) =>
          Object.fromEntries(row.map((value, index) => [`c${index}`, value])),
        ),
      )}`,
      t("import.errorFile"),
      "text/csv;charset=utf-8",
    );
  }

  function reset() {
    clearFile();
    mappedTable = null;
    syncMapping(null);
    result = null;
    submitted = false;
    currentIndex = 0;
  }

  $: steps = [
    t("step.upload"),
    t("step.map"),
    t("step.review"),
    t("step.import"),
  ];
  $: nextDisabled =
    currentIndex === 0
      ? !table || parsing || table.rows.length === 0
      : currentIndex === 1
        ? missing.length > 0 || mapping.every((key) => !key)
        : currentIndex === 2
          ? !summary || summary.valid === 0
          : importing;
  $: notImported = result
    ? result.failed.length +
      result.remaining +
      (summary?.errors ?? 0) +
      (summary?.duplicates ?? 0)
    : 0;
</script>

<div class:bx--import-wizard={true}>
  <Stepper
    id={baseId}
    {steps}
    bind:currentIndex
    bind:submitted
    {validate}
    submit={runImport}
    {nextDisabled}
    backText={t("back")}
    nextText={t("next")}
    submitText={t("import.action", { count: summary?.valid ?? 0 })}
    validatingDescription={t("checking")}
    {...$$restProps}
  >
    {#if submitted && result}
      <Stack gap={5}>
        <InlineNotification
          hideCloseButton
          lowContrast
          kind={result.imported === 0
            ? "error"
            : result.failed.length || result.canceled
              ? "warning"
              : "success"}
          title={result.canceled
            ? t("import.canceled", {
                count: result.imported,
                remaining: result.remaining,
              })
            : result.imported === 0
              ? t("import.failedAll")
              : result.failed.length
                ? t("import.partial", {
                    count: result.imported,
                    failed: result.failed.length,
                  })
                : t("import.done", { count: result.imported })}
          subtitle={notImported
            ? t("import.failedRows", { count: notImported })
            : ""}
        />
        <Stack gap={3} orientation="horizontal" wrap="wrap">
          {#if notImported}
            <Button kind="tertiary" on:click={downloadErrors}>
              {t("import.downloadErrors")}
            </Button>
          {/if}
          <Button kind="ghost" on:click={reset}>{t("import.again")}</Button>
        </Stack>
      </Stack>
    {:else if currentIndex === 0}
      <ImportWizardUpload
        id={baseId}
        {file}
        {parsing}
        {progress}
        {error}
        {parsed}
        {table}
        {hasHeader}
        {accept}
        {maxFileSize}
        {t}
        template={template && fields.length > 0}
        on:file={(event) => loadFile(event.detail)}
        on:rejected={(event) => rejectFile(event.detail[0]?.file.name ?? "")}
        on:cancel={clearFile}
        on:remove={clearFile}
        on:header={(event) => (hasHeader = event.detail)}
        on:template={downloadTemplate}
      />
    {:else if currentIndex === 1 && table}
      <ImportWizardMap
        {table}
        {fields}
        {auto}
        {missing}
        {t}
        bind:mapping
        bind:transforms
      />
    {:else if currentIndex === 2 && session}
      <ImportWizardReview
        {session}
        {t}
        on:change={(event) => (summary = event.detail)}
      />
    {:else if currentIndex === 3 && summary}
      <Stack gap={5}>
        <h3 class:bx--import-wizard__heading={true}>{t("import.heading")}</h3>
        <ul class:bx--import-wizard__counts={true}>
          <li>{t("import.count", { count: summary.valid })}</li>
          {#if summary.errors}
            <li>{t("import.skippedErrors", { count: summary.errors })}</li>
          {/if}
          {#if summary.duplicates}
            <li>
              {t("import.skippedDuplicates", { count: summary.duplicates })}
            </li>
          {/if}
        </ul>
        {#if importing}
          <ProgressBar
            value={importProgress.done}
            max={importProgress.total}
            labelText={t("import.progress", {
              done: importProgress.done,
              total: importProgress.total,
            })}
            helperText={canceling ? t("import.canceling") : ""}
          />
          <div>
            <Button
              kind="danger-tertiary"
              disabled={canceling}
              on:click={cancelImport}
            >
              {t("import.cancel")}
            </Button>
          </div>
        {:else if summary.errors + summary.duplicates > 0}
          <div>
            <Button kind="tertiary" on:click={downloadErrors}>
              {t("import.downloadErrors")}
            </Button>
          </div>
        {/if}
      </Stack>
    {/if}
  </Stepper>
</div>
