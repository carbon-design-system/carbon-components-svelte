<script>
  import {
    AILabel,
    Button,
    ComboBox,
    ComboButton,
    CopyButton,
    CopyInput,
    DataTable,
    DatePicker,
    DatePickerInput,
    Dropdown,
    MenuButton,
    MenuItem,
    MultiSelect,
    OperationalTag,
    OverflowMenu,
    OverflowMenuItem,
    PasswordInput,
    Toggletip,
    Tooltip,
    TooltipDefinition,
    TooltipIcon,
  } from "carbon-components-svelte";
  import Edit from "carbon-components-svelte/icons/Edit.svelte";
  import Information from "carbon-components-svelte/icons/Information.svelte";

  const cases = [
    "Dropdown",
    "ComboBox",
    "MultiSelect",
    "OverflowMenu",
    "MenuButton",
    "ComboButton",
    "Tooltip",
    "Toggletip",
    "OperationalTag",
    "AILabel",
    "DatePicker",
    "Button",
    "TooltipIcon",
    "TooltipDefinition",
    "PasswordInput",
    "CopyInput",
    "CopyButton",
  ];
  const headers = [
    { key: "name", value: "Name" },
    { key: "control", value: "Control" },
  ];
  // `?portal=false` passes the opt-out to the components that measure.
  const portal =
    new URLSearchParams(location.search).get("portal") === "false"
      ? false
      : undefined;
  const items = ["us-east", "us-south", "eu-de", "eu-gb"].map((text, i) => ({
    id: String(i),
    text,
  }));
</script>

<!-- One single-row table per component: the table's scroll box ends right
     under the cell, so an overlay that opens below it in place is cut off. -->
{#each cases as name (name)}
  <div data-testid={name} style="width: 480px; margin: 1rem">
    <DataTable {headers} rows={[{ id: name, name, control: "" }]}>
      <svelte:fragment slot="cell" let:cell>
        {#if cell.key === "name"}
          {cell.value}
        {:else if name === "Dropdown"}
          <Dropdown labelText="Region" hideLabel selectedId="0" {items} />
        {:else if name === "ComboBox"}
          <ComboBox labelText="Region" hideLabel {items} />
        {:else if name === "MultiSelect"}
          <MultiSelect labelText="Region" hideLabel label="Choose" {items} />
        {:else if name === "OverflowMenu"}
          <OverflowMenu iconDescription="Actions">
            <OverflowMenuItem text="Rename" />
            <OverflowMenuItem text="Delete" />
          </OverflowMenu>
        {:else if name === "MenuButton"}
          <MenuButton label="Actions">
            <MenuItem label="Rename" />
            <MenuItem label="Delete" />
          </MenuButton>
        {:else if name === "ComboButton"}
          <ComboButton label="Save">
            <MenuItem label="Save as" />
            <MenuItem label="Save all" />
          </ComboButton>
        {:else if name === "Tooltip"}
          <Tooltip triggerText="Usage">
            <p>Requests in the last 30 days, summed across every region.</p>
          </Tooltip>
        {:else if name === "Toggletip"}
          <Toggletip>
            <p>Requests in the last 30 days, summed across every region.</p>
          </Toggletip>
        {:else if name === "OperationalTag"}
          <OperationalTag>
            Owners
            <svelte:fragment slot="content">
              <p>Platform team, on call this week.</p>
            </svelte:fragment>
          </OperationalTag>
        {:else if name === "AILabel"}
          <AILabel>
            <p>
              Every value in this column is generated from 90 days of usage.
            </p>
          </AILabel>
        {:else if name === "DatePicker"}
          <DatePicker datePickerType="single" portalMenu={portal}>
            <DatePickerInput
              labelText="Due"
              hideLabel
              placeholder="mm/dd/yyyy"
            />
          </DatePicker>
        {:else if name === "Button"}
          <Button
            kind="ghost"
            size="sm"
            icon={Edit}
            iconDescription="Edit the service name"
            portalTooltip={portal}
          />
        {:else if name === "TooltipIcon"}
          <TooltipIcon
            icon={Information}
            tooltipText="Requests in the last 30 days"
            portalTooltip={portal}
          />
        {:else if name === "TooltipDefinition"}
          <TooltipDefinition
            tooltipText="Requests in the last 30 days"
            portalTooltip={portal}
          >
            Usage
          </TooltipDefinition>
        {:else if name === "PasswordInput"}
          <PasswordInput
            labelText="Token"
            hideLabel
            value="secret"
            portalTooltip={portal}
          />
        {:else if name === "CopyInput"}
          <CopyInput labelText="Token" hideLabel value="abc-123" />
        {:else if name === "CopyButton"}
          <CopyButton text="abc-123" />
        {/if}
      </svelte:fragment>
    </DataTable>
  </div>
{/each}
