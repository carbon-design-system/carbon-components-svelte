<script>
  /**
   * @typedef {import("./rows.js").KeyValueRow} KeyValueRow
   * @typedef {{ id: string; text: string }} KeyValueScope
   * @typedef {import("./rows.js").IssueCode} KeyValueIssueCode
   * @typedef {{ index: number; field: "key" | "value"; code: KeyValueIssueCode; severity: "error" | "warn"; message: string }} KeyValueIssue
   * @typedef {{ error: boolean; warning: boolean; text: string }} FieldState
   * @typedef {import("./parse.js").ParseError} KeyValueParseError
   * @typedef {import("./parse.js").KeyValueSyntax} KeyValueSyntax
   * @typedef {{ type: "added" | "removed" | "moved"; position: number; count: number } | { type: "imported"; added: number; updated: number; skipped: number; count: number } | { type: "mode"; mode: "rows" | "text"; count: number } | { type: "copied"; position: number } | { type: "invalid"; errors: number }} KeyValueAnnouncement
   * @event {KeyValueRow[]} change - Dispatched after the user edits, adds, removes, moves or imports rows.
   * @event {{ index: number; source: "button" | "ghost" | "paste" }} add - Cancelable. Dispatched before a row is added by the Add button or by typing in the new-row line.
   * @event {{ index: number; row: KeyValueRow }} remove - Cancelable. Dispatched before a row is removed.
   * @event {{ from: number; to: number }} move - Cancelable. Dispatched before a row moves.
   * @event {{ entries: import("./parse.js").ParsedEntry[]; errors: KeyValueParseError[]; syntax: KeyValueSyntax; text: string }} paste - Cancelable. Dispatched when pasted text in a key field reads as several rows; call `preventDefault()` to handle the text yourself.
   * @event {{ added: number; updated: number; skipped: number }} import - Dispatched after pasted or typed text is merged into the rows.
   * @slot {{}} empty - Replace the empty state. Shown when there are no rows and `addMode` is `"button"`.
   * @slot {{}} toolbar - Add controls to the toolbar above the rows.
   * @slot {{}} labelChildren - Replace the label text.
   * @restProps {fieldset}
   */

  /**
   * Specify the rows. Rows are never edited in place: an edit assigns a new
   * array of new row objects, so `bind:rows` and `on:change` both see it.
   * A row is `{ key, value }` plus optional `secret`, `stored`, `enabled`,
   * `description` and `scope`.
   * @type {KeyValueRow[]}
   * @bindable writable
   */
  export let rows = [];

  /**
   * Specify what the rows are. The format sets the key rules, whether keys
   * match without case, the text syntax of the bulk editor and of export,
   * and what a pasted line may look like.
   *
   * - `"env"`: environment variables. Keys are POSIX names; the text is `KEY=value`.
   * - `"headers"`: HTTP headers. Keys are field names and match without case; the text is `Name: value`.
   * - `"plain"`: labels, tags and metadata. Any key that has no `=` or edge spaces; the text is `key=value`.
   * @type {"env" | "headers" | "plain"}
   */
  export let format = "plain";

  /**
   * Specify how a row is added. `"button"` adds an empty row with the Add
   * button. `"ghost"` keeps an empty line at the end of the list: typing in
   * it turns it into a row, in place, and a new empty line follows.
   * @type {"button" | "ghost"}
   */
  export let addMode = "button";

  /**
   * Add columns. Key and value always show. `"enabled"` adds a checkbox that
   * keeps a row without using it, `"secret"` a checkbox that masks the value,
   * `"scope"` a select from `scopes`, and `"description"` a text field.
   * @type {ReadonlyArray<"enabled" | "secret" | "scope" | "description">}
   */
  export let columns = [];

  /**
   * Specify the choices of the `"scope"` column, such as environments.
   * With scopes, a key may repeat across scopes; an empty scope means all.
   * @type {ReadonlyArray<KeyValueScope>}
   */
  export let scopes = [];

  /**
   * Set the size of the fields.
   * Inherits the parent `Form` size when unset.
   * @type {"sm" | "md" | "lg" | undefined}
   */
  export let size = undefined;

  /** Specify the label text. It names the group of rows. */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Specify the helper text */
  export let helperText = "";

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /** Set to `true` to show the rows without letting users change them */
  export let readonly = false;

  /** Set to `true` to disable the editor */
  export let disabled = false;

  /** Set to `true` to require at least one row with a key */
  export let required = false;

  /**
   * Specify a name for native form submission. Each row posts under
   * `name[0][key]`, `name[0][value]`, and, for the columns that are on,
   * `[secret]`, `[enabled]`, `[scope]` and `[description]`. A `stored`
   * secret posts `[stored]` and no value. `rowsFromFormData` reads them back.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Specify the id of a form element outside the component to associate
   * the fields with.
   * @type {string | undefined}
   */
  export let form = undefined;

  /** Set an id for the editor. Inner ids are derived from it. */
  export let id = uniqueId();

  /**
   * Override the pattern a key must match. `null` accepts any key.
   * The default comes from `format`.
   * @type {RegExp | null | undefined}
   */
  export let keyPattern = undefined;

  /**
   * Specify whether `"Accept"` and `"accept"` are the same key.
   * The default comes from `format`.
   * @type {boolean | undefined}
   */
  export let caseInsensitiveKeys = undefined;

  /**
   * Specify what a repeated key is. Both rows are marked.
   * @type {"error" | "warn" | "allow"}
   */
  export let duplicateKeys = "error";

  /**
   * Specify the longest key, in characters.
   * @type {number | undefined}
   */
  export let maxKeyLength = undefined;

  /**
   * Specify the longest value, in characters.
   * @type {number | undefined}
   */
  export let maxValueLength = undefined;

  /**
   * Specify keys that cannot be used, as a list or a function.
   * @type {ReadonlyArray<string> | ((key: string) => boolean) | undefined}
   */
  export let reservedKeys = undefined;

  /**
   * Check a row after the built-in rules. Return a message for the key, the
   * value, or both.
   * @type {((row: KeyValueRow, index: number, rows: ReadonlyArray<KeyValueRow>) => { key?: string; value?: string } | undefined | void) | undefined}
   */
  export let validate = undefined;

  /**
   * Specify the most rows. Add is disabled at the limit, and a paste stops
   * there.
   * @type {number | undefined}
   */
  export let maxRows = undefined;

  /** Set to `false` to import pasted text at once, without asking */
  export let confirmPaste = true;

  /** Set to `false` to remove the bulk text editor */
  export let bulkEdit = true;

  /**
   * Specify the formats of the export menu. The default follows `format`:
   * `["env", "json"]`, or `["headers", "json"]` for headers. An empty list
   * removes the menu.
   * @type {ReadonlyArray<KeyValueSyntax> | undefined}
   */
  export let exportFormats = undefined;

  /** Specify the name of an exported file, without the extension */
  export let exportFileName = "variables";

  /** Set to `false` to remove the copy button from each row */
  export let copyable = true;

  /** Set to `false` to let a form submit with invalid rows. By default a `submit` with an error is stopped before the form's own handlers run, and the rows that need attention are listed */
  export let validateOnSubmit = true;

  /**
   * Whether no row has an error.
   * @type {boolean}
   * @bindable readonly
   */
  export let valid = true;

  /**
   * Every error and warning in the rows, with its message.
   * @type {KeyValueIssue[]}
   * @bindable readonly
   */
  export let issues = [];

  /**
   * Obtain a reference to the fieldset element.
   * @type {null | HTMLFieldSetElement}
   * @bindable readonly
   */
  export let ref = null;

  /** Specify the text of the key column */
  export let keyLabel = "Key";

  /** Specify the text of the value column */
  export let valueLabel = "Value";

  /** Specify the text of the enabled column */
  export let enabledLabel = "Enabled";

  /** Specify the text of the secret column */
  export let secretLabel = "Secret";

  /** Specify the text of the scope column */
  export let scopeLabel = "Applies to";

  /** Specify the text of the description column */
  export let descriptionLabel = "Description";

  /** Specify the key placeholder */
  export let keyPlaceholder = "";

  /** Specify the value placeholder */
  export let valuePlaceholder = "";

  /** Specify the text of the Add button */
  export let addText = "Add row";

  /** Specify the text of the empty state heading */
  export let emptyText = "No rows yet";

  /** Specify the text under the empty state heading */
  export let emptyDescription = "Add a row, or paste several into a key field.";

  /** Specify the text of the toolbar button that shows the bulk editor */
  export let editAsTextText = "Edit as text";

  /** Specify the text of the toolbar button that shows the rows */
  export let editAsRowsText = "Edit as rows";

  /** Specify the label of the bulk editor */
  export let bulkLabel = "Rows as text";

  /** Specify the text of the export menu */
  export let exportText = "Export";

  /** Specify the text of the Import button of a paste */
  export let importConfirmText = "Import";

  /** Specify the text of the Cancel button of a paste */
  export let importCancelText = "Cancel";

  /** Specify the text that stands in for a stored secret */
  export let storedText = "Stored";

  /** Specify the text of the required message */
  export let requiredText = "Add at least one row.";

  /** Specify the text of the maximum message */
  export let maxRowsText = "You have reached the maximum number of rows.";

  /**
   * Specify the accessible name of a row.
   * @type {(position: number, count: number) => string}
   */
  export let rowText = (position, count) => `Row ${position} of ${count}`;

  /**
   * Specify the accessible name of a row's actions.
   * @type {(position: number) => string}
   */
  export let actionsText = (position) => `Actions for row ${position}`;

  /**
   * Specify the accessible name of a row's remove button.
   * @type {(position: number) => string}
   */
  export let removeText = (position) => `Remove row ${position}`;

  /**
   * Specify the accessible name of a row's move up button.
   * @type {(position: number) => string}
   */
  export let moveUpText = (position) => `Move row ${position} up`;

  /**
   * Specify the accessible name of a row's move down button.
   * @type {(position: number) => string}
   */
  export let moveDownText = (position) => `Move row ${position} down`;

  /**
   * Specify the accessible name of a row's copy button.
   * @type {(position: number) => string}
   */
  export let copyValueText = (position) => `Copy the value of row ${position}`;

  /** Specify the text of a stored secret's Replace button */
  export let replaceText = "Replace";

  /**
   * Specify the accessible name of a stored secret's Replace button.
   * @type {(position: number) => string}
   */
  export let replaceDescription = (position) =>
    `Replace the value of row ${position}`;

  /**
   * Specify the message of an issue.
   * @type {(issue: { code: KeyValueIssueCode; severity: "error" | "warn"; message?: string; limit?: number }, context: { format: "env" | "headers" | "plain"; key: string }) => string}
   */
  export let issueText = defaultIssueText;

  /**
   * Specify the message of a paste. `summary` counts what would change.
   * @type {(summary: { added: number; updated: number; skipped: number; errors: number; syntax: KeyValueSyntax }) => string}
   */
  export let importText = defaultImportText;

  /**
   * Specify the message of a line the parser could not read.
   * @type {(error: KeyValueParseError, syntax: KeyValueSyntax) => string}
   */
  export let parseErrorText = defaultParseErrorText;

  /**
   * Specify the heading of the list of rows that need attention.
   * @type {(count: number) => string}
   */
  export let summaryText = (count) =>
    count === 1 ? "1 row needs attention" : `${count} rows need attention`;

  /**
   * Specify what a screen reader hears after an action.
   * @type {(announcement: KeyValueAnnouncement) => string}
   */
  export let announceText = defaultAnnounceText;

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import Button from "../Button/Button.svelte";
  import Checkbox from "../Checkbox/Checkbox.svelte";
  import { createStatusAnnouncer } from "../ListBox/menu-status.js";
  import MenuItem from "../Menu/MenuItem.svelte";
  import MenuButton from "../MenuButton/MenuButton.svelte";
  import Select from "../Select/Select.svelte";
  import SelectItem from "../Select/SelectItem.svelte";
  import TextArea from "../TextArea/TextArea.svelte";
  import PasswordInput from "../TextInput/PasswordInput.svelte";
  import TextInput from "../TextInput/TextInput.svelte";
  import { FORM_SIZE_CONTEXT_KEY } from "../constants/context-keys.js";
  import Add from "../icons/Add.svelte";
  import ArrowDown from "../icons/ArrowDown.svelte";
  import ArrowUp from "../icons/ArrowUp.svelte";
  import Close from "../icons/Close.svelte";
  import Copy from "../icons/Copy.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import { copyText } from "../utils/copy-text.js";
  import { downloadFile } from "../utils/download-file.js";
  import {
    buildFieldIds,
    joinDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { fieldsetDisabled } from "../utils/fieldset-disabled.js";
  import { formReset } from "../utils/form-reset.js";
  import { rovingFocus } from "../utils/roving-focus.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { detectSyntax, parseKeyValue, serializeKeyValue } from "./parse.js";
  import {
    formatDefaults,
    mergeEntries,
    moveRow,
    rowsFromEntries,
    validateRows,
  } from "./rows.js";

  /** @type {import("svelte/store").Readable<undefined | "xs" | "sm" | "md" | "xl"> | undefined} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);

  const dispatch = createEventDispatcher();

  /**
   * @param {{ code: KeyValueIssueCode; message?: string; limit?: number }} issue
   * @param {{ format: "env" | "headers" | "plain"; key: string }} context
   */
  function defaultIssueText(issue, context) {
    switch (issue.code) {
      case "key-required":
        return "Enter a key for this value.";
      case "key-pattern":
        if (context.format === "env") {
          return "Use letters, numbers and underscores, and do not start with a number.";
        }
        if (context.format === "headers") {
          return "Use letters, numbers and these symbols: ! # $ % & ' * + - . ^ _ ` | ~";
        }
        return "Remove the equals sign and any spaces at the ends of the key.";
      case "key-duplicate":
        return `${context.key} is used more than once. Use each key once.`;
      case "key-reserved":
        return `${context.key} is reserved. Use another key.`;
      case "key-too-long":
        return `Use ${issue.limit} characters or fewer in the key.`;
      case "value-too-long":
        return `Use ${issue.limit} characters or fewer in the value.`;
      case "value-invalid":
        return "Remove line breaks and control characters from the value.";
      default:
        return issue.message ?? "Check this row.";
    }
  }

  /**
   * @param {{ added: number; updated: number; skipped: number; errors: number }} summary
   */
  function defaultImportText({ added, updated, skipped, errors }) {
    const parts = [];
    if (added) parts.push(`${added} new ${added === 1 ? "row" : "rows"}`);
    if (updated) {
      parts.push(
        `${updated} existing ${updated === 1 ? "row" : "rows"} updated`,
      );
    }
    let text = `Import ${parts.join(" and ") || "nothing"}?`;
    const left = skipped + errors;
    if (left) {
      text += ` ${left} ${left === 1 ? "line cannot" : "lines cannot"} be imported.`;
    }
    return text;
  }

  /**
   * @param {KeyValueParseError} error
   * @param {KeyValueSyntax} syntax
   */
  function defaultParseErrorText(error, syntax) {
    const where =
      error.line === 0
        ? ""
        : syntax === "json"
          ? `Entry ${error.line}: `
          : `Line ${error.line}: `;
    switch (error.code) {
      case "no-separator":
        return `${where}Add ${syntax === "headers" ? "a colon" : "an equals sign"} between the key and the value.`;
      case "empty-key":
        return `${where}Add a key.`;
      case "unterminated-quote":
        return `${where}Close the quote, or remove it.`;
      case "trailing-characters":
        return `${where}Remove the text after the closing quote.`;
      case "invalid-json":
        return "The text is not valid JSON.";
      case "not-an-object":
        return `${where}Use an object of keys and values, or a list of { "key", "value" } pairs.`;
      case "nested-value":
        return `${where}Use text, a number or true or false, not an object or a list.`;
      default:
        return "The text is too long to import.";
    }
  }

  /** @param {KeyValueAnnouncement} a */
  function defaultAnnounceText(a) {
    switch (a.type) {
      case "added":
        return `Row ${a.position} added. ${a.count} rows.`;
      case "removed":
        return `Row ${a.position} removed. ${a.count} ${a.count === 1 ? "row" : "rows"}.`;
      case "moved":
        return `Moved to position ${a.position} of ${a.count}.`;
      case "imported":
        return `${a.added} added, ${a.updated} updated. ${a.count} rows.`;
      case "copied":
        return `Copied the value of row ${a.position}.`;
      case "mode":
        return a.mode === "text"
          ? "Editing as text."
          : `Editing as rows. ${a.count} rows.`;
      default:
        return `${a.errors} ${a.errors === 1 ? "row needs" : "rows need"} attention.`;
    }
  }

  // Row identity. A row keeps its id across edits because each edit copies the
  // id from the old object to the new one. State is per instance.
  let nextRowId = 0;
  const ids = new WeakMap();
  /** @returns {string} */
  function mintId() {
    nextRowId += 1;
    return `r${nextRowId}`;
  }
  let ghostId = mintId();

  /**
   * @param {ReadonlyArray<KeyValueRow>} list
   * @returns {string[]}
   */
  function idsOf(list) {
    const seen = new Set();
    return list.map((row) => {
      let rowId = ids.get(row);
      // The same object twice would be a duplicate key in the each block.
      if (!rowId || seen.has(rowId)) {
        rowId = mintId();
        ids.set(row, rowId);
      }
      seen.add(rowId);
      return rowId;
    });
  }

  /** @type {KeyValueRow} */
  const GHOST = { key: "", value: "" };

  let root = /** @type {null | HTMLDivElement} */ (null);
  let inDisabledFieldset = false;
  let submitted = false;
  /** @type {Record<string, true>} */
  let touched = {};
  let textMode = false;
  let text = "";
  /** @type {KeyValueRow[]} */
  let textBase = [];
  /** @type {KeyValueParseError[]} */
  let textErrors = [];
  /** @type {null | { entries: import("./parse.js").ParsedEntry[]; errors: KeyValueParseError[]; syntax: KeyValueSyntax; text: string; index: number; origin: string | null }} */
  let pending = null;
  let announcement = "";
  const announce = createStatusAnnouncer((value) => (announcement = value));
  let actionIndex = 1;
  let summaryEl = /** @type {null | HTMLDivElement} */ (null);
  let addButton = /** @type {null | HTMLButtonElement | HTMLAnchorElement} */ (
    null
  );
  let importButton =
    /** @type {null | HTMLButtonElement | HTMLAnchorElement} */ (null);
  const initialRows = rows;

  $: effectiveDisabled = disabled || inDisabledFieldset;
  $: fieldSize = size ?? $formSize;
  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid,
    warn,
    disabled: effectiveDisabled,
    readonly,
  }));
  $: ({ helperId, errorId, warnId } = buildFieldIds(id));
  $: ghost = addMode === "ghost" && !readonly && !effectiveDisabled && !atMax;
  $: rowIds = idsOf(rows);
  $: displayIds = ghost ? [...rowIds, ghostId] : rowIds;
  $: count = rows.length;
  $: atMax = maxRows !== undefined && count >= maxRows;
  $: hasEnabled = columns.includes("enabled");
  $: hasSecret = columns.includes("secret");
  $: hasScope = columns.includes("scope") && scopes.length > 0;
  $: hasDescription = columns.includes("description");
  /** @type {KeyValueSyntax} */
  $: syntax = format === "headers" ? "headers" : "env";
  /** @type {ReadonlyArray<KeyValueSyntax>} */
  $: formats =
    exportFormats ??
    (format === "headers" ? ["headers", "json"] : ["env", "json"]);
  $: caseless = caseInsensitiveKeys ?? format === "headers";
  $: actions = [
    copyable && "copy",
    !readonly && "up",
    !readonly && "down",
    !readonly && "remove",
  ].filter(Boolean);
  $: if (actionIndex >= actions.length)
    actionIndex = Math.max(0, actions.length - 1);

  $: validationOptions = {
    ...formatDefaults(format),
    ...(keyPattern === undefined ? {} : { keyPattern }),
    caseInsensitiveKeys: caseless,
    duplicateKeys,
    scoped: hasScope,
    maxKeyLength,
    maxValueLength,
    reservedKeys,
    validate,
  };
  $: results = validateRows(rows, validationOptions);
  $: missingRows =
    required && !rows.some((row) => row.key !== "") ? requiredText : "";
  $: valid = results.errors === 0 && !missingRows;
  $: issues = collectIssues(results, rows, format);

  /**
   * @param {import("./rows.js").ValidationResult} result
   * @param {ReadonlyArray<KeyValueRow>} list
   * @param {"env" | "headers" | "plain"} kind
   * @returns {KeyValueIssue[]}
   */
  function collectIssues(result, list, kind) {
    /** @type {KeyValueIssue[]} */
    const found = [];
    result.rows.forEach((entry, index) => {
      if (!entry) return;
      for (const field of /** @type {const} */ (["key", "value"])) {
        const issue = entry[field];
        if (!issue) continue;
        found.push({
          index,
          field,
          code: issue.code,
          severity: issue.severity,
          message: issueText(issue, { format: kind, key: list[index].key }),
        });
      }
    });
    return found;
  }

  // A row shows its messages once focus has left it, or after a submit. A
  // repeated key marks the other rows with that key as soon as one of them
  // is left.
  $: touchedKeys = touchedKeySet(rows, rowIds, touched, caseless);
  $: states = fieldStates(
    rows,
    rowIds,
    results,
    touched,
    submitted,
    touchedKeys,
    caseless,
    issueText,
    format,
  );

  /**
   * @param {ReadonlyArray<KeyValueRow>} list
   * @param {string[]} listIds
   * @param {Record<string, true>} done
   * @param {boolean} fold
   */
  function touchedKeySet(list, listIds, done, fold) {
    const set = new Set();
    list.forEach((row, index) => {
      if (done[listIds[index]] && row.key) {
        set.add(fold ? row.key.toLowerCase() : row.key);
      }
    });
    return set;
  }

  /**
   * The message state of each shown field. Every input it reads is an
   * argument, so Svelte 3 and 4 re-run the statement that calls it.
   *
   * @param {ReadonlyArray<KeyValueRow>} list
   * @param {string[]} listIds
   * @param {import("./rows.js").ValidationResult} result
   * @param {Record<string, true>} done
   * @param {boolean} all
   * @param {Set<string>} keys
   * @param {boolean} fold
   * @param {typeof issueText} toText
   * @param {"env" | "headers" | "plain"} kind
   * @returns {({ key: FieldState | null; value: FieldState | null } | undefined)[]}
   */
  function fieldStates(
    list,
    listIds,
    result,
    done,
    all,
    keys,
    fold,
    toText,
    kind,
  ) {
    return result.rows.map((entry, index) => {
      if (!entry) return undefined;
      const row = list[index];
      const open = all || done[listIds[index]];
      /** @param {import("./rows.js").FieldIssue | undefined} issue */
      const state = (issue) => {
        if (!issue) return null;
        const shown =
          open ||
          (issue.code === "key-duplicate" &&
            keys.has(fold ? row.key.toLowerCase() : row.key));
        return shown
          ? {
              error: issue.severity === "error",
              warning: issue.severity === "warn",
              text: toText(issue, { format: kind, key: row.key }),
            }
          : null;
      };
      return { key: state(entry.key), value: state(entry.value) };
    });
  }

  /**
   * @param {KeyValueRow[]} next
   */
  function commit(next) {
    rows = next;
    dispatch("change", next);
  }

  /**
   * @param {number} index
   * @param {Partial<KeyValueRow>} patch
   */
  function edit(index, patch) {
    if (readonly || effectiveDisabled) return;
    if (index >= rows.length) {
      const first = dispatch(
        "add",
        { index, source: "ghost" },
        { cancelable: true },
      );
      if (!first || atMax) return;
      /** @type {KeyValueRow} */
      const created = { key: "", value: "", ...patch };
      ids.set(created, ghostId);
      ghostId = mintId();
      commit([...rows, created]);
      announce(
        announceText({ type: "added", position: index + 1, count: index + 1 }),
      );
      return;
    }
    const previous = rows[index];
    const next = { ...previous, ...patch };
    for (const field of /** @type {(keyof KeyValueRow)[]} */ (
      Object.keys(patch)
    )) {
      if (patch[field] === undefined) delete next[field];
    }
    ids.set(next, ids.get(previous));
    const copy = rows.slice();
    copy[index] = next;
    commit(copy);
  }

  /** @param {string} rowId @param {string} [field] */
  async function focusField(rowId, field = "key") {
    await tick();
    /** @type {HTMLElement | null | undefined} */
    const target = root?.querySelector(
      `[data-kv-row="${rowId}"] [data-kv-field="${field}"]`,
    );
    target?.focus();
  }

  function addRow() {
    if (readonly || effectiveDisabled || atMax) return;
    const index = rows.length;
    if (!dispatch("add", { index, source: "button" }, { cancelable: true }))
      return;
    /** @type {KeyValueRow} */
    const created = { key: "", value: "" };
    ids.set(created, ghostId);
    const rowId = ghostId;
    ghostId = mintId();
    commit([...rows, created]);
    announce(
      announceText({ type: "added", position: index + 1, count: index + 1 }),
    );
    focusField(rowId);
  }

  /** @param {number} index */
  function copyRow(index) {
    const row = rows[index];
    if (!row || row.stored || row.value === "") return;
    copyText(row.value).then(() =>
      announce(announceText({ type: "copied", position: index + 1 })),
    );
  }

  /** @param {number} index */
  function removeRow(index) {
    if (readonly || effectiveDisabled) return;
    const row = rows[index];
    if (!row || !dispatch("remove", { index, row }, { cancelable: true }))
      return;
    const neighbor = rows[index + 1] ?? rows[index - 1];
    const neighborId = neighbor ? ids.get(neighbor) : undefined;
    commit(rows.filter((_, i) => i !== index));
    announce(
      announceText({
        type: "removed",
        position: index + 1,
        count: rows.length,
      }),
    );
    if (neighborId) focusField(neighborId);
    else if (ghost) focusField(ghostId);
    else tick().then(() => addButton?.focus());
  }

  /**
   * @param {number} index
   * @param {number} to
   * @param {string} [kind] - The control to focus again, once the row has moved.
   */
  function shiftRow(index, to, kind) {
    if (readonly || effectiveDisabled) return;
    const target = Math.max(0, Math.min(rows.length - 1, to));
    if (target === index || !rows[index]) return;
    if (!dispatch("move", { from: index, to: target }, { cancelable: true }))
      return;
    const rowId = ids.get(rows[index]);
    commit(/** @type {KeyValueRow[]} */ (moveRow(rows, index, target)));
    announce(
      announceText({ type: "moved", position: target + 1, count: rows.length }),
    );
    // Moving a node in the DOM drops focus, so put it back on the control
    // the user was in.
    if (rowId) focusField(rowId, kind);
  }

  /**
   * @param {KeyboardEvent} event
   * @param {number} index
   */
  function handleKeydown(event, index) {
    if (!event.altKey || !event.shiftKey || index >= rows.length) return;
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const field = /** @type {HTMLElement} */ (event.target).dataset.kvField;
    shiftRow(index, index + (event.key === "ArrowUp" ? -1 : 1), field);
  }

  /** @param {string} rowId */
  function touch(rowId) {
    if (!touched[rowId]) touched = { ...touched, [rowId]: true };
  }

  /**
   * @param {FocusEvent} event
   * @param {string} rowId
   */
  function handleFocusout(event, rowId) {
    const row = /** @type {HTMLElement} */ (event.currentTarget);
    if (!row.contains(/** @type {Node | null} */ (event.relatedTarget))) {
      touch(rowId);
    }
  }

  /**
   * Read the value of a field event: TextInput sends the value as `detail`,
   * PasswordInput forwards the native event.
   * @param {Event} event
   * @returns {string}
   */
  function valueOf(event) {
    const detail = /** @type {CustomEvent} */ (event).detail;
    return typeof detail === "string"
      ? detail
      : /** @type {HTMLInputElement} */ (event.target).value;
  }

  /**
   * @param {ClipboardEvent} event
   * @param {number} index
   */
  function handlePaste(event, index) {
    if (readonly || effectiveDisabled) return;
    const pasted = event.clipboardData?.getData("text/plain") ?? "";
    if (!detectSyntax(pasted)) return;
    const parsed = parseKeyValue(pasted, "auto", {
      maxEntries: maxRows ?? undefined,
    });
    if (parsed.entries.length === 0) return;
    // A single plain key is just a key, even if it contains an equals sign
    // in the middle of a word; only text that reads as a pair is an import.
    event.preventDefault();
    const proceed = dispatch(
      "paste",
      {
        entries: parsed.entries,
        errors: parsed.errors,
        syntax: parsed.syntax,
        text: pasted,
      },
      { cancelable: true },
    );
    if (!proceed) return;
    const origin =
      /** @type {HTMLElement} */ (event.target)
        .closest("[data-kv-row]")
        ?.getAttribute("data-kv-row") ?? null;
    if (confirmPaste) {
      pending = { ...parsed, text: pasted, index, origin };
      tick().then(() => importButton?.focus());
    } else {
      applyImport({ ...parsed, text: pasted, index, origin });
    }
  }

  /**
   * @param {NonNullable<typeof pending>} paste
   */
  function applyImport(paste) {
    const merged = mergeEntries(rows, paste.entries, {
      replace: paste.index,
      caseInsensitive: caseless,
      limit: maxRows,
    });
    pending = null;
    // Rows that were updated or filled keep the id of the row they replace,
    // so they are not remounted; rows after the old end get fresh ids.
    /** @type {Record<string, true>} */
    const shown = { ...touched };
    merged.rows.forEach((row, index) => {
      const original = rows[index];
      if (original && row !== original) ids.set(row, ids.get(original));
      if (row !== original) {
        const rowId = ids.get(row) ?? mintId();
        ids.set(row, rowId);
        shown[rowId] = true;
      }
    });
    touched = shown;
    const first = merged.rows[merged.firstIndex];
    commit(merged.rows);
    const skipped = merged.skipped + paste.errors.length;
    dispatch("import", {
      added: merged.added,
      updated: merged.updated,
      skipped,
    });
    announce(
      announceText({
        type: "imported",
        added: merged.added,
        updated: merged.updated,
        skipped,
        count: merged.rows.length,
      }),
    );
    if (first) focusField(ids.get(first));
  }

  function cancelImport() {
    const origin = pending?.origin;
    pending = null;
    if (origin) focusField(origin);
  }

  /** @param {KeyboardEvent} event */
  function handlePendingKeydown(event) {
    if (event.key === "Escape") {
      event.stopPropagation();
      cancelImport();
    }
  }

  $: pendingSummary = pending
    ? (() => {
        const preview = mergeEntries(rows, pending.entries, {
          replace: pending.index,
          caseInsensitive: caseless,
          limit: maxRows,
        });
        return {
          added: preview.added,
          updated: preview.updated,
          skipped: preview.skipped,
          errors: pending.errors.length,
          syntax: pending.syntax,
        };
      })()
    : null;

  function toggleMode() {
    if (textMode) {
      if (textErrors.length > 0) {
        announce(announceText({ type: "invalid", errors: textErrors.length }));
        return;
      }
      textMode = false;
      announce(
        announceText({ type: "mode", mode: "rows", count: rows.length }),
      );
    } else {
      textBase = rows;
      text = serializeKeyValue(rows, syntax, { disabled: "comment" });
      textErrors = [];
      textMode = true;
      announce(
        announceText({ type: "mode", mode: "text", count: rows.length }),
      );
    }
  }

  /** @param {Event} event */
  function handleTextInput(event) {
    text = /** @type {HTMLTextAreaElement} */ (event.target).value;
    const parsed = parseKeyValue(text, syntax, {
      disabledComments: true,
      maxEntries: maxRows,
    });
    textErrors = parsed.errors;
    if (parsed.errors.length === 0 && text.trim() !== "") {
      const stored = rows.filter((row) => row.stored);
      const next = [
        ...rowsFromEntries(parsed.entries, textBase, {
          caseInsensitive: caseless,
        }),
        ...stored,
      ];
      reuseIds(next);
      commit(next);
    } else if (parsed.errors.length === 0) {
      commit(rows.filter((row) => row.stored));
    }
  }

  /**
   * Give rows rebuilt from text the ids of the rows at the same position, so
   * switching back does not remount every row.
   * @param {KeyValueRow[]} next
   */
  function reuseIds(next) {
    next.forEach((row, index) => {
      if (!ids.get(row))
        ids.set(row, rows[index] ? ids.get(rows[index]) : undefined);
    });
  }

  /** @param {number} line */
  function selectLine(line) {
    const area = /** @type {HTMLTextAreaElement | null | undefined} */ (
      root?.querySelector("[data-kv-field='text']")
    );
    if (!area) return;
    const lines = area.value.split("\n");
    let start = 0;
    for (let i = 0; i < line - 1 && i < lines.length; i++)
      start += lines[i].length + 1;
    area.focus();
    area.setSelectionRange(start, start + (lines[line - 1]?.length ?? 0));
  }

  /** @param {KeyValueSyntax} as */
  function exportAs(as) {
    const body = serializeKeyValue(rows, as, {
      disabled: "skip",
      array: as === "json" && format === "headers",
    });
    const types = {
      env: "text/plain",
      headers: "text/plain",
      json: "application/json",
    };
    const extensions = { env: ".env", headers: ".txt", json: ".json" };
    downloadFile(body, `${exportFileName}${extensions[as]}`, types[as]);
  }

  /** @param {string} as */
  function exportLabel(as) {
    return as === "env" ? ".env" : as === "headers" ? "Header lines" : "JSON";
  }

  /**
   * Check every row and show every message. Returns whether the rows are
   * valid; when they are not, focus moves to the list of what to fix.
   * @returns {boolean}
   */
  export function reportValidity() {
    submitted = true;
    const ok = valid;
    if (!ok) {
      announce(announceText({ type: "invalid", errors: results.errors }));
      tick().then(() => summaryEl?.focus());
    }
    return ok;
  }

  /**
   * Move focus to the key of a row.
   * @param {number} index
   */
  export function focusRow(index) {
    const row = rows[index];
    if (row) focusField(ids.get(row));
  }

  /** @param {Event} event */
  function guardSubmit(event) {
    if (!validateOnSubmit || effectiveDisabled) return;
    if (!reportValidity()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  onMount(() => {
    const owner = ref?.form ?? (form ? document.getElementById(form) : null);
    if (owner instanceof HTMLFormElement) {
      // Capturing, and stopping the event, keeps the form's own submit
      // handlers from running, as a failed native check does.
      owner.addEventListener("submit", guardSubmit, true);
      return () => owner.removeEventListener("submit", guardSubmit, true);
    }
  });

  // A native reset puts the inputs back to the markup's values, so rows go
  // back to what they were when the editor was made.
  function handleFormReset() {
    touched = {};
    submitted = false;
    textMode = false;
    commit(initialRows);
  }

  $: summaryIssues = submitted
    ? issues.filter((issue) => issue.severity === "error")
    : [];
  $: summaryCount = new Set(summaryIssues.map((issue) => issue.index)).size;
  $: rowTemplate = [
    hasEnabled && "var(--ccs-key-value-check, 2rem)",
    "minmax(0, 1fr)",
    "minmax(0, 2fr)",
    hasSecret && "var(--ccs-key-value-check, 2rem)",
    hasScope && "minmax(0, 12rem)",
    hasDescription && "minmax(0, 1.5fr)",
    actions.length > 0 &&
      `calc(${actions.length} * var(--ccs-key-value-action, 2rem))`,
  ]
    .filter(Boolean)
    .join(" ");
</script>

<div
  bind:this={root}
  use:fieldsetDisabled={(value) => (inDisabledFieldset = value)}
  use:formReset={handleFormReset}
  class:bx--form-item={true}
  class:bx--key-value-editor={true}
  class:bx--key-value-editor--sm={fieldSize === "sm" || fieldSize === "xs"}
  class:bx--key-value-editor--lg={fieldSize === "xl"}
  class:bx--key-value-editor--readonly={readonly}
  class:bx--key-value-editor--invalid={showInvalid}
  class:bx--key-value-editor--warning={showWarn}
  style:--ccs-key-value-columns={rowTemplate}
>
  <fieldset
    bind:this={ref}
    {form}
    class:bx--fieldset={true}
    class:bx--key-value-editor__fieldset={true}
    disabled={effectiveDisabled}
    data-invalid={showInvalid || undefined}
    {...$$restProps}
    aria-describedby={joinDescribedBy(
      showInvalid && invalidText ? errorId : null,
      showWarn && warnText ? warnId : null,
      !showInvalid && !showWarn && helperText ? helperId : null,
      $$restProps["aria-describedby"],
    )}
  >
    {#if labelText || $$slots.labelChildren}
      <legend class:bx--label={true} class:bx--visually-hidden={hideLabel}
        ><slot name="labelChildren">{labelText}</slot></legend
      >
    {/if}

    {#if (bulkEdit || formats.length > 0 || $$slots.toolbar) && !(readonly && !bulkEdit && formats.length === 0)}
      <div class:bx--key-value-editor__toolbar={true}>
        <div class:bx--key-value-editor__toolbar-start={true}>
          <slot name="toolbar" />
        </div>
        <div class:bx--key-value-editor__toolbar-end={true}>
          {#if bulkEdit && !readonly}
            <Button
              kind="ghost"
              size="sm"
              disabled={effectiveDisabled}
              aria-pressed={textMode ? "true" : "false"}
              on:click={toggleMode}
            >
              {textMode ? editAsRowsText : editAsTextText}
            </Button>
          {/if}
          {#if formats.length > 0}
            <MenuButton
              kind="ghost"
              size="sm"
              labelText={exportText}
              disabled={effectiveDisabled || rows.length === 0}
            >
              {#each formats as as (as)}
                <MenuItem
                  labelText={exportLabel(as)}
                  on:click={() => exportAs(as)}
                />
              {/each}
            </MenuButton>
          {/if}
        </div>
      </div>
    {/if}

    {#if textMode}
      <div class:bx--key-value-editor__text={true}>
        <TextArea
          labelText={bulkLabel}
          value={text}
          rows={12}
          invalid={textErrors.length > 0}
          invalidText={summaryText(textErrors.length)}
          {readonly}
          disabled={effectiveDisabled}
          spellcheck="false"
          autocomplete="off"
          autocapitalize="off"
          dir="ltr"
          data-kv-field="text"
          on:input={handleTextInput}
        />
        {#if textErrors.length > 0}
          <ul class:bx--key-value-editor__parse-errors={true}>
            {#each textErrors as error, at (at)}
              <li>
                {#if error.line > 0}
                  <button
                    type="button"
                    class:bx--link={true}
                    on:click={() => selectLine(error.line)}
                    >{parseErrorText(error, syntax)}</button
                  >
                {:else}
                  {parseErrorText(error, syntax)}
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
        {#if name}
          {#each rows as row, index (rowIds[index])}
            <input
              type="hidden"
              {form}
              name="{name}[{index}][key]"
              value={row.key}
            />
            {#if !row.stored}
              <input
                type="hidden"
                {form}
                name="{name}[{index}][value]"
                value={row.value}
              />
            {/if}
          {/each}
        {/if}
      </div>
    {:else}
      {#if summaryIssues.length > 0}
        <div
          bind:this={summaryEl}
          role="group"
          tabindex="-1"
          aria-labelledby="{id}-summary-title"
          class:bx--key-value-editor__summary={true}
        >
          <p
            id="{id}-summary-title"
            class:bx--key-value-editor__summary-title={true}
          >
            <WarningFilled class="bx--key-value-editor__summary-icon" />
            {summaryText(summaryCount)}
          </p>
          <ul class:bx--key-value-editor__summary-list={true}>
            {#each summaryIssues as issue (`${issue.index}-${issue.field}`)}
              <li>
                <button
                  type="button"
                  class:bx--link={true}
                  on:click={() =>
                    focusField(ids.get(rows[issue.index]), issue.field)}
                  >{rowText(issue.index + 1, count)}: {issue.message}</button
                >
              </li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if count > 0 || ghost}
        <div class:bx--key-value-editor__head={true} aria-hidden="true">
          {#if hasEnabled}<span class:bx--label={true}>{enabledLabel}</span
            >{/if}
          <span class:bx--label={true}>{keyLabel}</span>
          <span class:bx--label={true}>{valueLabel}</span>
          {#if hasSecret}<span class:bx--label={true}>{secretLabel}</span>{/if}
          {#if hasScope}<span class:bx--label={true}>{scopeLabel}</span>{/if}
          {#if hasDescription}<span class:bx--label={true}
              >{descriptionLabel}</span
            >{/if}
          {#if actions.length > 0}<span></span>{/if}
        </div>
        <div class:bx--key-value-editor__rows={true}>
          {#each displayIds as rowId, index (rowId)}
            {@const isGhost = index >= count}
            {@const row = isGhost ? GHOST : rows[index]}
            {@const keyState = states[index]?.key}
            {@const valueState = states[index]?.value}
            {@const base = `${id}-${index}`}
            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            <div
              role="group"
              aria-label={isGhost ? addText : rowText(index + 1, count)}
              data-kv-row={rowId}
              class:bx--key-value-editor__row={true}
              class:bx--key-value-editor__row--ghost={isGhost}
              class:bx--key-value-editor__row--disabled={row.enabled === false}
              on:focusout={(event) => handleFocusout(event, rowId)}
            >
              {#if hasEnabled}
                <div class:bx--key-value-editor__check={true}>
                  {#if !isGhost}
                    <Checkbox
                      labelText={enabledLabel}
                      checked={row.enabled !== false}
                      disabled={effectiveDisabled}
                      {readonly}
                      on:check={(event) =>
                        edit(index, { enabled: event.detail })}
                    />
                  {/if}
                </div>
              {/if}

              <div class:bx--key-value-editor__cell={true}>
                <TextInput
                  id="{base}-key"
                  labelText={keyLabel}
                  value={row.key}
                  size={fieldSize}
                  placeholder={keyPlaceholder}
                  disabled={effectiveDisabled}
                  {readonly}
                  invalid={!!keyState?.error}
                  invalidText={keyState?.error ? keyState.text : ""}
                  warn={!!keyState?.warning}
                  warnText={keyState?.warning ? keyState.text : ""}
                  name={name && !isGhost ? `${name}[${index}][key]` : undefined}
                  {form}
                  dir="ltr"
                  autocomplete="off"
                  autocapitalize="off"
                  spellcheck="false"
                  data-kv-field="key"
                  on:input={(event) => edit(index, { key: valueOf(event) })}
                  on:keydown={(event) => handleKeydown(event, index)}
                  on:paste={(event) => handlePaste(event, index)}
                />
              </div>

              <div class:bx--key-value-editor__cell={true}>
                {#if row.stored}
                  <span class:bx--label={true}>{valueLabel}</span>
                  <div class:bx--key-value-editor__stored={true}>
                    <span
                      class:bx--key-value-editor__mask={true}
                      aria-label={storedText}
                      role="img">••••••••</span
                    >
                    {#if !readonly}
                      <Button
                        kind="tertiary"
                        size="sm"
                        disabled={effectiveDisabled}
                        data-kv-field="replace"
                        aria-label={replaceDescription(index + 1)}
                        on:click={() => {
                          edit(index, { stored: undefined, value: "" });
                          focusField(rowId, "value");
                        }}>{replaceText}</Button
                      >
                    {/if}
                  </div>
                {:else if row.secret}
                  <PasswordInput
                    id="{base}-value"
                    labelText={valueLabel}
                    value={row.value}
                    size={fieldSize}
                    placeholder={valuePlaceholder}
                    disabled={effectiveDisabled}
                    {readonly}
                    invalid={!!valueState?.error}
                    invalidText={valueState?.error ? valueState.text : ""}
                    name={name && !isGhost
                      ? `${name}[${index}][value]`
                      : undefined}
                    {form}
                    dir="auto"
                    autocomplete="new-password"
                    data-kv-field="value"
                    on:input={(event) => edit(index, { value: valueOf(event) })}
                    on:keydown={(event) => handleKeydown(event, index)}
                  />
                {:else}
                  <TextInput
                    id="{base}-value"
                    labelText={valueLabel}
                    value={row.value}
                    size={fieldSize}
                    placeholder={valuePlaceholder}
                    disabled={effectiveDisabled}
                    {readonly}
                    invalid={!!valueState?.error}
                    invalidText={valueState?.error ? valueState.text : ""}
                    name={name && !isGhost
                      ? `${name}[${index}][value]`
                      : undefined}
                    {form}
                    dir="auto"
                    autocomplete="off"
                    autocapitalize="off"
                    spellcheck="false"
                    data-kv-field="value"
                    on:input={(event) => edit(index, { value: valueOf(event) })}
                    on:keydown={(event) => handleKeydown(event, index)}
                  />
                {/if}
              </div>

              {#if hasSecret}
                <div class:bx--key-value-editor__check={true}>
                  {#if !isGhost}
                    <Checkbox
                      labelText={secretLabel}
                      checked={!!row.secret}
                      disabled={effectiveDisabled || !!row.stored}
                      {readonly}
                      on:check={(event) =>
                        edit(index, { secret: event.detail })}
                    />
                  {/if}
                </div>
              {/if}

              {#if hasScope}
                <div class:bx--key-value-editor__cell={true}>
                  {#if !isGhost}
                    <Select
                      labelText={scopeLabel}
                      selected={row.scope ?? ""}
                      size={fieldSize}
                      disabled={effectiveDisabled}
                      name={name ? `${name}[${index}][scope]` : undefined}
                      {form}
                      on:update={(event) =>
                        edit(index, { scope: event.detail })}
                    >
                      {#each scopes as scope (scope.id)}
                        <SelectItem value={scope.id} text={scope.text} />
                      {/each}
                    </Select>
                  {/if}
                </div>
              {/if}

              {#if hasDescription}
                <div class:bx--key-value-editor__cell={true}>
                  {#if !isGhost}
                    <TextInput
                      id="{base}-description"
                      labelText={descriptionLabel}
                      value={row.description ?? ""}
                      size={fieldSize}
                      disabled={effectiveDisabled}
                      {readonly}
                      name={name ? `${name}[${index}][description]` : undefined}
                      {form}
                      dir="auto"
                      data-kv-field="description"
                      on:input={(event) =>
                        edit(index, { description: valueOf(event) })}
                    />
                  {/if}
                </div>
              {/if}

              {#if actions.length > 0}
                <div
                  class:bx--key-value-editor__actions={true}
                  role={isGhost ? undefined : "toolbar"}
                  aria-label={isGhost ? undefined : actionsText(index + 1)}
                  use:rovingFocus={{
                    selector: "button",
                    getActiveIndex: () => actionIndex,
                    onMove: (next) => (actionIndex = next),
                    focusOnMove: true,
                    wrap: false,
                  }}
                >
                  {#if !isGhost}
                    {#each actions as action, n (action)}
                      {#if action === "copy"}
                        <Button
                          kind="ghost"
                          size="sm"
                          icon={Copy}
                          iconDescription={copyValueText(index + 1)}
                          data-kv-field="copy"
                          tooltipPosition="top"
                          tabindex={actionIndex === n ? "0" : "-1"}
                          disabled={effectiveDisabled}
                          aria-disabled={row.stored || row.value === ""
                            ? "true"
                            : undefined}
                          aria-pressed={undefined}
                          class={row.stored || row.value === ""
                            ? "bx--btn--disabled"
                            : undefined}
                          on:click={() => copyRow(index)}
                        />
                      {:else if action === "up"}
                        <Button
                          kind="ghost"
                          size="sm"
                          icon={ArrowUp}
                          iconDescription={moveUpText(index + 1)}
                          data-kv-field="up"
                          tooltipPosition="top"
                          tabindex={actionIndex === n ? "0" : "-1"}
                          disabled={effectiveDisabled}
                          aria-disabled={index === 0 ? "true" : undefined}
                          aria-pressed={undefined}
                          class={index === 0 ? "bx--btn--disabled" : undefined}
                          on:click={() => shiftRow(index, index - 1, "up")}
                        />
                      {:else if action === "down"}
                        <Button
                          kind="ghost"
                          size="sm"
                          icon={ArrowDown}
                          iconDescription={moveDownText(index + 1)}
                          data-kv-field="down"
                          tooltipPosition="top"
                          tabindex={actionIndex === n ? "0" : "-1"}
                          disabled={effectiveDisabled}
                          aria-disabled={index === count - 1
                            ? "true"
                            : undefined}
                          aria-pressed={undefined}
                          class={index === count - 1
                            ? "bx--btn--disabled"
                            : undefined}
                          on:click={() => shiftRow(index, index + 1, "down")}
                        />
                      {:else}
                        <Button
                          kind="ghost"
                          size="sm"
                          icon={Close}
                          iconDescription={removeText(index + 1)}
                          data-kv-field="remove"
                          tooltipPosition="top"
                          tabindex={actionIndex === n ? "0" : "-1"}
                          disabled={effectiveDisabled}
                          aria-pressed={undefined}
                          on:click={() => removeRow(index)}
                        />
                      {/if}
                    {/each}
                  {/if}
                </div>
              {/if}

              {#if name && !isGhost}
                {#if hasSecret && row.secret}
                  <input
                    type="hidden"
                    {form}
                    name="{name}[{index}][secret]"
                    value="1"
                  />
                {/if}
                {#if row.stored}
                  <input
                    type="hidden"
                    {form}
                    name="{name}[{index}][stored]"
                    value="1"
                  />
                {/if}
                {#if hasEnabled}
                  <input
                    type="hidden"
                    {form}
                    name="{name}[{index}][enabled]"
                    value={row.enabled === false ? "0" : "1"}
                  />
                {/if}
              {/if}
            </div>
          {/each}
        </div>
      {:else if $$slots.empty}
        <slot name="empty" />
      {:else}
        <div class:bx--key-value-editor__empty={true}>
          <p class:bx--key-value-editor__empty-title={true}>{emptyText}</p>
          <p class:bx--key-value-editor__empty-description={true}>
            {emptyDescription}
          </p>
        </div>
      {/if}

      {#if pending && pendingSummary}
        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
        <div
          role="group"
          aria-labelledby="{id}-import-title"
          class:bx--key-value-editor__import={true}
          on:keydown={handlePendingKeydown}
        >
          <p
            id="{id}-import-title"
            class:bx--key-value-editor__import-title={true}
          >
            {importText(pendingSummary)}
          </p>
          {#if pending.errors.length > 0}
            <ul class:bx--key-value-editor__parse-errors={true}>
              {#each pending.errors.slice(0, 5) as error, at (at)}
                <li>{parseErrorText(error, pending.syntax)}</li>
              {/each}
            </ul>
          {/if}
          <div class:bx--key-value-editor__import-actions={true}>
            <Button
              bind:ref={importButton}
              size="sm"
              on:click={() => pending && applyImport(pending)}
              >{importConfirmText}</Button
            >
            <Button kind="ghost" size="sm" on:click={cancelImport}
              >{importCancelText}</Button
            >
          </div>
        </div>
      {/if}

      {#if !readonly && addMode === "button"}
        <div class:bx--key-value-editor__add={true}>
          <Button
            bind:ref={addButton}
            kind="tertiary"
            size="sm"
            icon={Add}
            disabled={effectiveDisabled}
            aria-disabled={atMax ? "true" : undefined}
            on:click={addRow}>{addText}</Button
          >
          {#if atMax}
            <span class:bx--form__helper-text={true}>{maxRowsText}</span>
          {/if}
        </div>
      {:else if atMax && !readonly}
        <p class:bx--form__helper-text={true}>{maxRowsText}</p>
      {/if}
    {/if}

    {#if showInvalid && invalidText}
      <div id={errorId} class:bx--form-requirement={true} role="alert">
        {invalidText}
      </div>
    {:else if showWarn && warnText}
      <div id={warnId} class:bx--form-requirement={true}>{warnText}</div>
    {:else if submitted && missingRows}
      <div class:bx--form-requirement={true} role="alert">{missingRows}</div>
    {/if}

    <span role="status" aria-live="polite" class:bx--visually-hidden={true}
      >{announcement}</span
    >
  </fieldset>
  {#if helperText && !showInvalid && !showWarn}
    <div
      id={helperId}
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={effectiveDisabled}
    >
      {helperText}
    </div>
  {/if}
</div>
