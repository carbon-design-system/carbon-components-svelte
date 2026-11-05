<script>
  import {
    DataTable,
    DatePicker,
    DatePickerInput,
    FileUploader,
    LocaleProvider,
    NumberInput,
    Pagination,
    RelativeTime,
    Select,
    SelectItem,
    Stack,
  } from "carbon-components-svelte";

  /** The locale the page starts in. */
  export let initial = "de-DE";

  const locales = ["en-US", "de-DE", "ar-EG", "ja-JP", "fr-CH"];
  const now = Date.parse("2026-09-13T12:00:00Z");
  const file = new File(["x".repeat(1500)], "report.txt");
  const headers = [{ key: "name", value: "Name" }];
  const rows = [
    { id: "a", name: "Zoë" },
    { id: "b", name: "Ärger" },
    { id: "c", name: "Anna" },
  ];

  let locale = initial;
</script>

<Stack gap={7}>
  <Select labelText="Locale" bind:selected={locale}>
    {#each locales as id (id)}
      <SelectItem value={id} text={id} />
    {/each}
  </Select>

  <div data-testid="provider-region">
    <LocaleProvider {locale} timeZone="UTC" dir="auto" data-testid="provider">
      <Stack gap={6}>
        <NumberInput labelText="Amount" value={1234567.89} />
        <RelativeTime
          data-testid="relative-time"
          date={now - 5 * 60 * 1000}
          {now}
        />
        <DatePicker datePickerType="single">
          <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" />
        </DatePicker>
        <Pagination totalItems={12345} pageSize={10} pageSizes={[10]} />
        <DataTable
          sortable
          sortKey="name"
          sortDirection="ascending"
          {headers}
          {rows}
        />
        <FileUploader
          labelTitle="Files"
          buttonLabel="Add file"
          files={[file]}
          fileSize
        />
        <LocaleProvider locale="fr-CH">
          <NumberInput labelText="Nested (fr-CH)" value={1234567.89} />
        </LocaleProvider>
      </Stack>
    </LocaleProvider>
  </div>

  <!-- Outside the provider, so it prints with the browser's own defaults. -->
  <RelativeTime data-testid="runtime-time" date={now - 5 * 60 * 1000} {now} />
</Stack>
