<script>
  import {
    Button,
    InputGroup,
    NumberInput,
    Select,
    SelectItem,
    TextInput,
  } from "carbon-components-svelte";
  import Send from "carbon-icons-svelte/lib/Send.svelte";
</script>

{#each ["xs", "sm", undefined, "xl"] as size}
  <div
    data-testid="group-{size ?? 'md'}"
    style:width="480px"
    style:margin-bottom="24px"
  >
    <InputGroup {size}>
      <TextInput labelText="Promo code" />
      <Button kind="tertiary">Apply</Button>
    </InputGroup>
  </div>
{/each}

<div data-testid="group-invalid" style:width="480px" style:margin-bottom="24px">
  <InputGroup
    invalid
    invalidText="Enter a valid email address"
    let:describedBy
    let:invalid
  >
    <TextInput labelText="Email" aria-describedby={describedBy} {invalid} />
    <Button>Subscribe</Button>
  </InputGroup>
</div>

<div data-testid="group-icon" style:width="480px" style:margin-bottom="24px">
  <InputGroup>
    <TextInput hideLabel labelText="Message" />
    <Button icon={Send} iconDescription="Send" />
  </InputGroup>
</div>

<div data-testid="group-amount" style:width="240px">
  <InputGroup legendText="Price">
    <NumberInput hideLabel labelText="Amount" value={1200} hideSteppers />
    <div style:width="6rem">
      <Select hideLabel labelText="Currency" selected="USD">
        <SelectItem value="USD" />
        <SelectItem value="EUR" />
      </Select>
    </div>
  </InputGroup>
</div>
