<script>
  import {
    DatePicker,
    DatePickerInput,
    Dropdown,
    LayoutDirection,
    PinCodeInput,
    Slider,
    Tab,
    Tabs,
    Tooltip,
  } from "carbon-components-svelte";
</script>

<!-- A plain `dir` inside a LayoutDirection, each way round. -->
{#each [["rtl", "ltr"], ["ltr", "rtl"]] as [outer, inner] (outer)}
  <LayoutDirection dir={outer}>
    <div data-testid="plain-{inner}" dir={inner}>
      <PinCodeInput labelText="Verification code ({inner})" />
      <Slider labelText="Replicas ({inner})" value={20} />
      <Tabs>
        <Tab label="Overview ({inner})" />
        <Tab label="Logs ({inner})" />
        <Tab label="Settings ({inner})" />
      </Tabs>
      <Dropdown
        portalMenu
        labelText="Region ({inner})"
        selectedId="0"
        items={[
          { id: "0", text: "us-east-1" },
          { id: "1", text: "eu-west-1" },
        ]}
      />
      <Tooltip portalTooltip iconDescription="Billing ({inner})">
        <p>Billed monthly</p>
      </Tooltip>
      <DatePicker datePickerType="single" portalMenu>
        <DatePickerInput labelText="Date ({inner})" placeholder="mm/dd/yyyy" />
      </DatePicker>
    </div>
  </LayoutDirection>
{/each}
