<script>
  import {
    ContentSwitcher,
    DatePicker,
    DatePickerInput,
    Pagination,
    ProgressIndicator,
    ProgressStep,
    Switch,
  } from "carbon-components-svelte";
  import TableOfContents from "carbon-icons-svelte/lib/TableOfContents.svelte";

  const boxes = [
    { id: "cut", width: 200 },
    { id: "fits", width: 960 },
  ];
</script>

<!-- Each component twice: in a box too narrow for its text, and in one
     wide enough. -->
{#each boxes as { id, width } (id)}
  <div
    data-testid={id}
    style:display="grid"
    style:grid-template-columns="minmax(0, 1fr)"
    style:gap="1rem"
    style:margin-bottom="2rem"
    style:width="{width}px"
  >
    <div data-testid="pagination">
      <Pagination totalItems={120} pageSize={10} pageSizes={[10]} page={3} />
    </div>
    <div data-testid="progress-indicator">
      <ProgressIndicator spaceEqually preventChangeOnClick>
        <ProgressStep label="Team members" />
        <ProgressStep let:props>
          <span {...props}>Billing plan</span>
        </ProgressStep>
      </ProgressIndicator>
    </div>
    <div data-testid="content-switcher">
      <ContentSwitcher>
        <Switch><TableOfContents /> Table of contents</Switch>
        <Switch text="List" />
      </ContentSwitcher>
    </div>
    <div data-testid="date-picker">
      <DatePicker
        datePickerType="multiple"
        value={id === "cut"
          ? "09/09/2026, 09/10/2026, 09/11/2026, 09/12/2026"
          : "09/09/2026"}
      >
        <DatePickerInput labelText="Blackout dates" placeholder="mm/dd/yyyy" />
      </DatePicker>
    </div>
  </div>
{/each}
