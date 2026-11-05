<script lang="ts">
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import DatePicker from "carbon-components-svelte/DatePicker/DatePicker.svelte";
  import DatePickerInput from "carbon-components-svelte/DatePicker/DatePickerInput.svelte";
  import FileUploader from "carbon-components-svelte/FileUploader/FileUploader.svelte";
  import LocaleProvider from "carbon-components-svelte/LocaleProvider/LocaleProvider.svelte";
  import NumberInput from "carbon-components-svelte/NumberInput/NumberInput.svelte";
  import Pagination from "carbon-components-svelte/Pagination/Pagination.svelte";
  import RelativeTime from "carbon-components-svelte/RelativeTime/RelativeTime.svelte";
  import type { ComponentProps } from "svelte";

  export let provider: ComponentProps<LocaleProvider> | undefined = undefined;
  /** Props that the components set themselves, to win over the provider. */
  export let own: {
    numberInput?: Partial<ComponentProps<NumberInput>>;
    relativeTime?: Partial<ComponentProps<RelativeTime>>;
    pagination?: Partial<ComponentProps<Pagination>>;
    dataTable?: Partial<ComponentProps<DataTable>>;
    fileUploader?: Partial<ComponentProps<FileUploader>>;
    datePicker?: Partial<ComponentProps<DatePicker>>;
  } = {};

  const now = Date.parse("2026-09-13T12:00:00Z");
  const file = new File(["x".repeat(1500)], "report.txt");
  const rows = [
    { id: "a", name: "z" },
    { id: "b", name: "ä" },
    { id: "c", name: "a" },
  ];
</script>

<LocaleProvider {...provider}>
  <NumberInput labelText="Amount" value={1234.5} {...own.numberInput} />
  <RelativeTime
    data-testid="time"
    date={now - 5 * 60 * 1000}
    {now}
    {...own.relativeTime}
  />
  <Pagination
    totalItems={12345}
    pageSize={10}
    page={1}
    pageSizes={[10]}
    {...own.pagination}
  />
  <DataTable
    headers={[{ key: "name", value: "Name" }]}
    {rows}
    sortable
    sortKey="name"
    sortDirection="ascending"
    {...own.dataTable}
  />
  <FileUploader
    labelTitle="Upload"
    files={[file]}
    fileSize
    {...own.fileUploader}
  />
  <DatePicker datePickerType="single" {...own.datePicker}>
    <DatePickerInput labelText="Date" placeholder="mm/dd/yyyy" />
  </DatePicker>
</LocaleProvider>
