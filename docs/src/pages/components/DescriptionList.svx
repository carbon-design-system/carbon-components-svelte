---
components: ["DescriptionList", "DescriptionListItem", "CopyText"]
description: Description lists display term and detail pairs, such as metadata or properties, using native dl, dt, and dd elements.
---

<script>
  import { CopyText, DescriptionList, DescriptionListItem, Link, NumberInput, SkeletonText, Stack, Toggletip } from "carbon-components-svelte";

  let nights = 2;
</script>

## Layouts

### Vertical

`DescriptionList` renders a native `<dl>`. Each `DescriptionListItem` wraps one `<dt>` term and its `<dd>` detail, so screen readers announce them as a description list rather than a table. Use [StructuredList](/components/StructuredList) instead when rows need selection or tabular columns.

By default, each term sits above its detail. Set the term with the `term` prop; slot the detail as children.

<DescriptionList>
  <DescriptionListItem term="Name">postgres-prod-01</DescriptionListItem>
  <DescriptionListItem term="Engine">PostgreSQL 16.2</DescriptionListItem>
  <DescriptionListItem term="Region">us-east-1</DescriptionListItem>
  <DescriptionListItem term="Created">March 14, 2026</DescriptionListItem>
</DescriptionList>

### Horizontal

Set `layout` to `"horizontal"` to place each term beside its detail.

<DescriptionList layout="horizontal">
  <DescriptionListItem term="Name">postgres-prod-01</DescriptionListItem>
  <DescriptionListItem term="Engine">PostgreSQL 16.2</DescriptionListItem>
  <DescriptionListItem term="Region">us-east-1</DescriptionListItem>
  <DescriptionListItem term="Created">March 14, 2026</DescriptionListItem>
</DescriptionList>

### Summary

Set `layout` to `"summary"` for an order or price breakdown. Each detail sits at the right edge in tabular figures, so amounts line up, and a long term wraps without pushing it. Set `total` on the last item to rule it off with a larger detail.

<DescriptionList layout="summary" gap={3}>
  <DescriptionListItem term="Subtotal">$128.00</DescriptionListItem>
  <DescriptionListItem term="Shipping">$9.00</DescriptionListItem>
  <DescriptionListItem term="Estimated tax">$10.24</DescriptionListItem>
  <DescriptionListItem term="Total" total>$147.24</DescriptionListItem>
</DescriptionList>

### Columns

Set `columns` to arrange items in an equal-width grid.

<DescriptionList columns={2}>
  <DescriptionListItem term="Name">postgres-prod-01</DescriptionListItem>
  <DescriptionListItem term="Engine">PostgreSQL 16.2</DescriptionListItem>
  <DescriptionListItem term="Region">us-east-1</DescriptionListItem>
  <DescriptionListItem term="Created">March 14, 2026</DescriptionListItem>
</DescriptionList>

## Rich terms

Use the `term` slot for more than plain text, such as a Toggletip that explains a charge or a link to change a plan. The slot overrides the `term` prop.

<DescriptionList layout="summary" gap={3}>
  <DescriptionListItem term="Subtotal">$128.00</DescriptionListItem>
  <DescriptionListItem>
    <svelte:fragment slot="term">
      <Toggletip labelText="Estimated tax">Based on your shipping address. The final amount is set at checkout.</Toggletip>
    </svelte:fragment>
    $10.24
  </DescriptionListItem>
  <DescriptionListItem>
    <svelte:fragment slot="term">
      Pro plan, billed yearly · <Link size="sm" href="#">Change</Link>
    </svelte:fragment>
    $96.00
  </DescriptionListItem>
  <DescriptionListItem term="Total" total>$234.24</DescriptionListItem>
</DescriptionList>

## Breakdowns

### Sections

Set `divider` to rule an item off from the items above without enlarging it, such as to start a group of taxes and fees.

<DescriptionList layout="summary" gap={3}>
  <DescriptionListItem term="Two nights, Deluxe King">$1,240.00</DescriptionListItem>
  <DescriptionListItem term="Breakfast for two">$64.00</DescriptionListItem>
  <DescriptionListItem term="City tax" divider>$18.00</DescriptionListItem>
  <DescriptionListItem term="Service fee">$25.00</DescriptionListItem>
  <DescriptionListItem term="Total" total>$1,347.00</DescriptionListItem>
</DescriptionList>

### Discounts and original prices

Write a discount with the minus sign (−, U+2212) and name it in the term. Screen readers don't announce strikethrough, so give a struck-through price visually hidden text.

<DescriptionList layout="summary" gap={3}>
  <DescriptionListItem term="Annual plan">
    <s><span class="bx--visually-hidden">Was </span>$160.00</s> $128.00
  </DescriptionListItem>
  <DescriptionListItem term="Promo SPRING10">−$12.80</DescriptionListItem>
  <DescriptionListItem term="Total" total>$115.20</DescriptionListItem>
</DescriptionList>

### Live total

A total that changes as the user edits the order changes silently for screen reader users. Set `aria-live="polite"` and `aria-atomic="true"` on the total item, so the term and the new amount are read together.

<Stack gap={5}>
  <NumberInput labelText="Nights" min={1} max={14} bind:value={nights} />
  <DescriptionList layout="summary" gap={3}>
    <DescriptionListItem term="{nights} nights at $620.00">${(nights * 620).toLocaleString("en-US")}.00</DescriptionListItem>
    <DescriptionListItem term="Service fee">$25.00</DescriptionListItem>
    <DescriptionListItem term="Total" total aria-live="polite" aria-atomic="true">${(nights * 620 + 25).toLocaleString("en-US")}.00</DescriptionListItem>
  </DescriptionList>
</Stack>

### Loading

While amounts are calculated, put a SkeletonText with `noMargin` in each detail, and set `aria-busy="true"` on the list until they arrive.

<DescriptionList layout="summary" gap={3} aria-busy="true">
  <DescriptionListItem term="Subtotal"><SkeletonText noMargin width="64px" /></DescriptionListItem>
  <DescriptionListItem term="Estimated tax"><SkeletonText noMargin width="48px" /></DescriptionListItem>
  <DescriptionListItem term="Total" total><SkeletonText noMargin width="96px" /></DescriptionListItem>
</DescriptionList>

### Usage

| Do | Why |
| --- | --- |
| Use `layout="summary"` for amounts and other short values. | Each detail keeps at least its longest word on one line, so a long sentence-like detail wraps and loses the clean right edge. |
| Mark only the final line `total`, and use `divider` for sections above it. | A larger detail reads as the answer; two of them compete. |
| Name a discount in the term, not only by the sign of the amount. | The term carries the meaning even if the minus sign is missed. |
| Keep live regions to the total. | Announcing every line on each change repeats information the user just entered. |

## Gap

Use `gap` to pick a spacing step from 1–13 (the same scale as [Stack](/components/Stack)), or pass a custom value such as `"22px"`. The default is step 5 (16px).

<DescriptionList gap={7}>
  <DescriptionListItem term="Name">postgres-prod-01</DescriptionListItem>
  <DescriptionListItem term="Engine">PostgreSQL 16.2</DescriptionListItem>
  <DescriptionListItem term="Region">us-east-1</DescriptionListItem>
</DescriptionList>

## Copyable value

To copy one value, put [CopyText](/components/CopyText) in an item's detail. It renders the value inline with a compact copy button beside it. The value is copied as rendered, or set `text` to copy something different from what is displayed.

<DescriptionList>
  <DescriptionListItem term="Name">postgres-prod-01</DescriptionListItem>
  <DescriptionListItem term="Endpoint"><CopyText>postgres-prod-01.acme.io:5432</CopyText></DescriptionListItem>
  <DescriptionListItem term="Webhook"><CopyText text="https://api.acme.io/webhooks/incoming/f8a2c91d">https://api.acme.io/…/f8a2c91d</CopyText></DescriptionListItem>
  <DescriptionListItem term="Region">us-east-1</DescriptionListItem>
</DescriptionList>
