<script>
  import {
    Button,
    Modal,
    RecurrencePicker,
    Stack,
  } from "carbon-components-svelte";

  let value = "FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH";
  let modalValue = "";
  let open = false;
</script>

<Stack gap={7}>
  <div data-testid="rp-default">
    <RecurrencePicker
      bind:value
      startDate={new Date(2026, 10, 3)}
      previewCount={3}
    />
    <p data-testid="rp-value">{value}</p>
  </div>

  <div data-testid="rp-de">
    <RecurrencePicker
      locale="de"
      value="FREQ=WEEKLY;BYDAY=MO,WE"
      startDate={new Date(2026, 10, 2)}
      labelText="Wiederholung"
      text={{ frequency: "Wiederholen", weekly: "Wöchentlich" }}
      summaryText={(rule, { format }) =>
        `Jede Woche am ${format.list(
          (rule.byDay ?? []).map(({ day }) => format.weekday(day)),
        )}`}
    />
  </div>

  <div data-testid="rp-ar">
    <RecurrencePicker
      locale="ar-EG"
      value="FREQ=WEEKLY;BYDAY=SU"
      startDate={new Date(2026, 10, 1)}
    />
  </div>

  <div data-testid="rp-march">
    <RecurrencePicker
      value="FREQ=DAILY"
      startDate={new Date(2026, 2, 7, 2, 30)}
      previewCount={4}
    />
  </div>

  <div data-testid="rp-november">
    <RecurrencePicker
      value="FREQ=DAILY"
      startDate={new Date(2026, 9, 31, 1, 30)}
      previewCount={4}
    />
  </div>

  <div data-testid="rp-feb29">
    <RecurrencePicker
      value="FREQ=YEARLY"
      startDate={new Date(2024, 1, 29)}
      previewCount={3}
    />
  </div>

  <div data-testid="rp-31st">
    <RecurrencePicker
      value="FREQ=MONTHLY"
      startDate={new Date(2026, 0, 31)}
      previewCount={4}
    />
  </div>

  <Button data-testid="rp-open" on:click={() => (open = true)}
    >Open modal</Button
  >
  <span data-testid="rp-modal-value">{modalValue}</span>
</Stack>

<Modal
  bind:open
  modalHeading="Repeat event"
  primaryButtonText="Save"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (open = false)}
>
  <div data-testid="rp-modal">
    <RecurrencePicker
      bind:value={modalValue}
      startDate={new Date(2026, 10, 3)}
    />
  </div>
</Modal>
