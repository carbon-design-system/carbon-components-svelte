// @ts-check

/**
 * @typedef {"step.upload" | "step.map" | "step.review" | "step.import"
 *   | "upload.dropLabel" | "upload.reading" | "upload.cancel" | "upload.remove" | "upload.failed"
 *   | "upload.header" | "upload.summary" | "upload.preview" | "upload.template" | "upload.empty" | "upload.truncated"
 *   | "upload.unclosedQuote" | "upload.strayQuote" | "upload.short" | "upload.long"
 *   | "upload.format.csv" | "upload.delimiter.comma" | "upload.delimiter.semicolon" | "upload.delimiter.tab" | "upload.delimiter.pipe" | "upload.format.xlsx" | "upload.rejected"
 *   | "map.heading" | "map.source" | "map.sample" | "map.target" | "map.status"
 *   | "map.skip" | "map.targetLabel" | "map.required" | "map.missing" | "map.reassigned"
 *   | "map.matched" | "map.alias" | "map.similar" | "map.manual" | "map.skipped" | "map.empty"
 *   | "map.values" | "map.valueTarget" | "map.dateFormat" | "map.unmapped" | "map.leave"
 *   | "review.heading" | "review.valid" | "review.errors" | "review.duplicates" | "review.removed"
 *   | "review.onlyErrors" | "review.row" | "review.actions" | "review.fixLabel" | "review.removeErrors" | "review.removeRow"
 *   | "review.replace" | "review.replaceColumn" | "review.replaceFind" | "review.replaceWith"
 *   | "review.replaceWhole" | "review.replaceApply" | "review.replaced" | "review.noErrors" | "review.none"
 *   | "review.tableLabel" | "review.fixed" | "review.showing"
 *   | "import.heading" | "import.count" | "import.skippedErrors" | "import.skippedDuplicates"
 *   | "import.action" | "import.progress" | "import.cancel" | "import.canceling"
 *   | "import.done" | "import.partial" | "import.canceled" | "import.failedAll" | "import.nothing"
 *   | "import.downloadErrors" | "import.again" | "import.failedRows" | "import.errorFile"
 *   | "back" | "next" | "checking"} ImportWizardTranslationId
 */

/** @type {Record<ImportWizardTranslationId, string>} */
const en = {
  "step.upload": "Upload",
  "step.map": "Map columns",
  "step.review": "Review",
  "step.import": "Import",

  "upload.dropLabel":
    "Drag and drop a CSV or XLSX file here or click to upload",
  "upload.reading": "Reading {name}",
  "upload.cancel": "Cancel",
  "upload.remove": "Remove file",
  "upload.failed": "Couldn't read the file",
  "upload.header": "The first row contains column names",
  "upload.summary": "{rows} rows, {columns} columns. {format}.",
  "upload.preview": "First rows of the file",
  "upload.template": "Download a template",
  "upload.empty": "The file has no rows to import",
  "upload.truncated": "Only the first {rows} rows were read.",
  "upload.unclosedQuote":
    "A quoted value near row {row} never closes, so the rest of the file became one value. Check the file.",
  "upload.strayQuote":
    "{count} values have text after a closing quote. They were kept as written.",
  "upload.short":
    "{count} rows have fewer values than the header. They were padded with empty values.",
  "upload.long":
    "{count} rows have more values than the header. They are marked as errors.",
  "upload.format.csv": "{delimiter}-separated, {encoding}",
  "upload.delimiter.comma": "Comma",
  "upload.delimiter.semicolon": "Semicolon",
  "upload.delimiter.tab": "Tab",
  "upload.delimiter.pipe": "Pipe",
  "upload.format.xlsx": "Sheet {sheet}",
  "upload.rejected": "{name} isn't a CSV or XLSX file or is too large",

  "map.heading": "Match each column to a field",
  "map.source": "Column in your file",
  "map.sample": "Sample values",
  "map.target": "Field",
  "map.status": "Match",
  "map.skip": "Don't import",
  "map.targetLabel": "Field for {column}",
  "map.required": "required",
  "map.missing": "Map these required fields to continue: {fields}",
  "map.reassigned": "{field} moved from {column}",
  "map.matched": "Matched",
  "map.alias": "Matched by alias",
  "map.similar": "Similar, {score}%",
  "map.manual": "Chosen",
  "map.skipped": "Skipped",
  "map.empty": "(empty)",
  "map.values": "Match the values of {field}",
  "map.valueTarget": "Value for {value}",
  "map.dateFormat": "Date format of {field}",
  "map.unmapped": "Not matched",
  "map.leave": "Leave as it is",

  "review.heading": "Review and fix",
  "review.valid": "{count} valid",
  "review.errors": "{count} with errors",
  "review.duplicates": "{count} duplicates",
  "review.removed": "{count} removed",
  "review.onlyErrors": "Show only rows with errors",
  "review.row": "Row",
  "review.actions": "Actions",
  "review.fixLabel": "{field}, row {row}",
  "review.removeErrors": "Remove rows with errors",
  "review.removeRow": "Remove row {row}",
  "review.replace": "Find and replace",
  "review.replaceColumn": "Field",
  "review.replaceFind": "Find",
  "review.replaceWith": "Replace with",
  "review.replaceWhole": "Match the whole value",
  "review.replaceApply": "Replace",
  "review.replaced": "Replaced {count} values",
  "review.noErrors": "No rows have errors",
  "review.none": "Nothing to show",
  "review.tableLabel": "Rows to review",
  "review.fixed": "Row {row} fixed",
  "review.showing": "Showing {shown} of {total} rows",

  "import.heading": "Ready to import",
  "import.count": "{count} rows will be imported",
  "import.skippedErrors": "{count} rows with errors will be skipped",
  "import.skippedDuplicates": "{count} duplicate rows will be skipped",
  "import.action": "Import {count} rows",
  "import.progress": "Imported {done} of {total} rows",
  "import.cancel": "Cancel import",
  "import.canceling": "Canceling after this batch",
  "import.done": "Imported {count} rows",
  "import.partial": "Imported {count} rows, {failed} failed",
  "import.canceled":
    "Canceled: imported {count} rows, {remaining} not imported",
  "import.failedAll": "No rows were imported",
  "import.nothing": "There are no rows to import",
  "import.downloadErrors": "Download rows not imported",
  "import.again": "Import another file",
  "import.failedRows": "{count} rows weren't imported",
  "import.errorFile": "rows-not-imported.csv",

  back: "Back",
  next: "Continue",
  checking: "Checking rows",
};

/**
 * The English text of the wizard. Replace it, or parts of it, with the
 * `translateWithId` prop.
 * @param {ImportWizardTranslationId} id
 * @param {Record<string, string | number>} [values]
 * @returns {string}
 */
export function defaultTranslate(id, values) {
  const text = en[id] ?? id;
  if (!values) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) => {
    const value = values[name];
    if (value === undefined) return match;
    return typeof value === "number" ? value.toLocaleString() : String(value);
  });
}
