<script>
  import { ImportWizard } from "carbon-components-svelte";

  // `const` keeps each `type` a literal for the type check.
  const fields = /** @type {const} */ ([
    { key: "project", label: "Project", required: true },
    { key: "start", label: "Start", type: "date", required: true },
    { key: "end", label: "End", type: "date" },
    {
      key: "code",
      label: "Cost code",
      pattern: /^[A-Z]{2}-\d{4}$/,
      patternMessage:
        "Use two capitals, a hyphen and four digits, such as FN-0042",
      validate: (value) =>
        value?.startsWith("XX") ? "XX codes are reserved" : undefined,
    },
  ]);

  // Runs once the cells of a row are valid, so `record` holds converted values.
  function validateRow(record) {
    if (record.end && record.end < record.start) {
      return { end: "End is before the start date" };
    }
  }
</script>

<ImportWizard {fields} {validateRow} />
