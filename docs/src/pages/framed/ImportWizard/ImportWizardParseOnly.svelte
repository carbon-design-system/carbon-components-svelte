<script>
  import {
    autoMap,
    FileUploaderButton,
    InlineNotification,
    parseFile,
    Stack,
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListRow,
  } from "carbon-components-svelte";

  const fields = [
    { key: "name", label: "Full name", aliases: ["customer"] },
    { key: "email", label: "Email", aliases: ["mail"] },
    { key: "role", label: "Role" },
  ];

  let parsed;
  let guess;
  let error = "";

  async function read(event) {
    const [file] = event.detail;
    error = "";
    try {
      parsed = await parseFile(file);
      guess = autoMap(parsed.rows[0] ?? [], fields);
    } catch (reason) {
      parsed = undefined;
      error = reason instanceof Error ? reason.message : String(reason);
    }
  }
</script>

<Stack gap={5}>
  <FileUploaderButton
    labelText="Choose a CSV or XLSX file"
    accept={[".csv", ".tsv", ".xlsx"]}
    on:change={read}
  />
  {#if error}
    <InlineNotification
      hideCloseButton
      title="Couldn't read the file"
      subtitle={error}
    />
  {/if}
  {#if parsed && guess}
    <StructuredList>
      <StructuredListBody>
        <StructuredListRow>
          <StructuredListCell head>Format</StructuredListCell>
          <StructuredListCell>
            {parsed.format}, {parsed.delimiter === "\t"
              ? "tab"
              : parsed.delimiter}
            {parsed.encoding}, read {parsed.thread === "worker"
              ? "in a worker"
              : "on the main thread"}
          </StructuredListCell>
        </StructuredListRow>
        <StructuredListRow>
          <StructuredListCell head>Rows</StructuredListCell>
          <StructuredListCell>{parsed.rows.length - 1}</StructuredListCell>
        </StructuredListRow>
        {#each parsed.rows[0] ?? [] as header, column}
          <StructuredListRow>
            <StructuredListCell head>{header}</StructuredListCell>
            <StructuredListCell>
              {guess.mapping[column] ?? "no match"}
              {#if guess.mapping[column]}({Math.round(
                  guess.scores[column] * 100,
                )}%){/if}
            </StructuredListCell>
          </StructuredListRow>
        {/each}
      </StructuredListBody>
    </StructuredList>
  {/if}
</Stack>
