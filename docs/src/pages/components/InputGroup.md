---
components: ["InputGroup"]
description: Input groups attach a button or a second field to an input, such as a code and its Apply button or an amount and its currency, with one shared message below.
---

<script>
  import { Box, Button, InputGroup, NumberInput, Select, SelectItem, TextInput } from "carbon-components-svelte";
  import Send from "carbon-icons-svelte/lib/Send.svelte";
</script>

## Basic

Wrap a field and a button in InputGroup, so the two read as one control and the button matches the field's height. Label the field itself.

<InputGroup>
  <TextInput labelText="Promo code" placeholder="WELCOME10" />
  <Button kind="tertiary">Apply</Button>
</InputGroup>

## Helper text

Helper text sits under the whole group. Pass the `describedBy` slot prop to the field so it is announced with it.

<InputGroup helperText="Lowercase letters, numbers and dashes" let:describedBy>
  <TextInput labelText="Workspace URL" placeholder="northwind" aria-describedby={describedBy} />
  <Button kind="tertiary">Check</Button>
</InputGroup>

## Icon button

An icon-only button is square at the field's height.

<InputGroup>
  <TextInput hideLabel labelText="Message" placeholder="Write a reply" />
  <Button icon={Send} iconDescription="Send" />
</InputGroup>

## Field set

When several fields make up one value, set `legendText` to name the set, and give each field its own hidden label. Fields share the row; to give one a fixed width, such as a currency beside an amount, wrap it in a Box with that width.

<InputGroup legendText="Price">
  <NumberInput hideLabel labelText="Amount" value={1200} hideSteppers />
  <Box width="6rem">
    <Select hideLabel labelText="Currency" selected="USD">
      <SelectItem value="USD" />
      <SelectItem value="EUR" />
      <SelectItem value="GBP" />
    </Select>
  </Box>
</InputGroup>

## Sizes

Set `size` on the group to size its fields; buttons match their height. The group inherits the `size` of a parent `Form`.

<InputGroup size="sm">
  <TextInput labelText="Promo code" placeholder="WELCOME10" />
  <Button kind="tertiary">Apply</Button>
</InputGroup>

<InputGroup size="xl">
  <TextInput labelText="Promo code" placeholder="WELCOME10" />
  <Button kind="tertiary">Apply</Button>
</InputGroup>

## States

Reflect validation and interaction states. The message shows under the group, so it never pushes the button out of line. Pass the `invalid` or `warn` slot prop to the field it applies to, along with `describedBy`.

### Invalid

<InputGroup invalid invalidText="Enter a valid email address" let:describedBy let:invalid>
  <TextInput labelText="Email" value="maria@" aria-describedby={describedBy} {invalid} />
  <Button>Subscribe</Button>
</InputGroup>

### Warning

<InputGroup warn warnText="This code ends tonight" let:describedBy let:warn>
  <TextInput labelText="Promo code" value="FLASH20" aria-describedby={describedBy} {warn} />
  <Button kind="tertiary">Apply</Button>
</InputGroup>

### Disabled

Set `disabled` to `true` to disable every field and button in the group.

<InputGroup disabled>
  <TextInput labelText="Promo code" placeholder="WELCOME10" />
  <Button kind="tertiary">Apply</Button>
</InputGroup>
