---
components: ["Card", "CardHeader", "CardBody", "CardFooter", "CardTitle", "CardMedia", "CardHeaderMedia", "CardTitleMedia", "CardActions", "CardAction"]
description: Cards group related content and actions on one surface, built from a header, body, footer and media.
---

<script>
  import {
    AILabel,
    Box,
    Button,
    Card,
    CardAction,
    CardActions,
    CardBody,
    CardFooter,
    CardHeader,
    CardMedia,
    CardTitle,
    CardTitleMedia,
    ContainedList,
    ContainedListItem,
    Layer,
    OverflowMenu,
    OverflowMenuItem,
    Stack,
  } from "carbon-components-svelte";
  import Launch from "carbon-icons-svelte/lib/Launch.svelte";
  import Report from "carbon-icons-svelte/lib/Report.svelte";
  import Star from "carbon-icons-svelte/lib/Star.svelte";
  import StarFilled from "carbon-icons-svelte/lib/StarFilled.svelte";

  let favorite = false;
</script>

## Basic

Compose a card from `CardHeader`, `CardBody` and `CardFooter`, the same way as a [ComposedModal](/components/ComposedModal). Use a [Tile](/components/Tile) for a plain container without these regions.

<Box maxWidth="20rem">
  <Card>
    <CardHeader>
      <CardTitle>Quarterly report</CardTitle>
    </CardHeader>
    <CardBody>
      Usage grew 12% over the last quarter, led by object storage.
    </CardBody>
    <CardFooter>
      <Button kind="ghost" size="sm">View report</Button>
    </CardFooter>
  </Card>
</Box>

## Clickable

Set `clickable` to `true` to make the whole card one interactive element, with hover, press and focus styles. The `CardTitle` gives the card its accessible name. Set `aria-label` or `aria-labelledby` to use a different name.

A clickable card can't hold other buttons or links, so it doesn't render a `CardFooter` or `CardActions`. It shows an arrow at the bottom instead.

### Link

Set `href` to render the card as a link.

<Box maxWidth="20rem">
  <Card clickable href="/components/Tile">
    <CardHeader>
      <CardTitle>Object storage</CardTitle>
    </CardHeader>
    <CardBody>82% of capacity used across three buckets.</CardBody>
  </Card>
</Box>

### Button

Without `href`, the card renders as a button. <DocKbd label="Enter" /> and <DocKbd label="Space" /> both click it.

<Box maxWidth="20rem">
  <Card clickable on:click={() => console.log("Open project settings")}>
    <CardHeader>
      <CardTitle>Project settings</CardTitle>
    </CardHeader>
    <CardBody>Manage members, permissions and integrations.</CardBody>
  </Card>
</Box>

### Icon

Set `icon` to change the arrow, such as `Launch` for a link that leaves the app. In a right-to-left layout, the icon mirrors, so an arrow points left. The prop is `icon`, as on [ClickableTile](/components/ClickableTile). When you port code from Carbon React, use it for `renderFooterIcon`.

<Box maxWidth="20rem">
  <Card
    clickable
    href="https://www.carbondesignsystem.com/"
    target="_blank"
    icon={Launch}
  >
    <CardHeader>
      <CardTitle>Carbon Design System</CardTitle>
    </CardHeader>
    <CardBody>Guidelines, components and patterns.</CardBody>
  </Card>
</Box>

## Expressive

Set `density` to `"expressive"` for a larger title. The default is `"productive"`.

<Box maxWidth="20rem">
  <Card density="expressive">
    <CardHeader>
      <CardTitle>Quarterly report</CardTitle>
    </CardHeader>
    <CardBody>
      Usage grew 12% over the last quarter, led by object storage.
    </CardBody>
  </Card>
</Box>

## Media

Put a `CardMedia` in the `media` slot. It renders above the content at the aspect ratio set with `ratio`. An image fills it and is cropped to fit. Use an empty `alt` for a decorative image.

<Box maxWidth="20rem">
  <Card>
    <CardMedia slot="media" ratio="2x1">
      <img src="/card-media.svg" alt="" />
    </CardMedia>
    <CardHeader>
      <CardTitle>Coastal sensors</CardTitle>
    </CardHeader>
    <CardBody>Tide and wave readings from 14 stations, every 10 minutes.</CardBody>
  </Card>
</Box>

### Horizontal

Set `horizontal` to `true` to put the media beside the content. It fills the card's height, at the width set with `mediaWidth` on `CardMedia`. Set `mediaPosition` to `"end"` to move it to the other side.

<Box maxWidth="32rem">
  <Card horizontal>
    <CardMedia slot="media" mediaWidth="40%">
      <img src="/card-media.svg" alt="" />
    </CardMedia>
    <CardHeader>
      <CardTitle>Coastal sensors</CardTitle>
    </CardHeader>
    <CardBody>Tide and wave readings from 14 stations, every 10 minutes.</CardBody>
  </Card>
</Box>

## Body without padding

Set `noPadding` on `CardBody` for content with its own spacing, such as a list, a table or a chart. The prop is `noPadding`, as on [Tile](/components/Tile). When you port code from Carbon React, use it for `isFlush`.

<Box maxWidth="20rem">
  <Card>
    <CardHeader>
      <CardTitle>Buckets</CardTitle>
    </CardHeader>
    <CardBody noPadding>
      <ContainedList labelText="Buckets" hideLabel>
        <ContainedListItem>billing-exports</ContainedListItem>
        <ContainedListItem>usage-archive</ContainedListItem>
        <ContainedListItem>support-uploads</ContainedListItem>
      </ContainedList>
    </CardBody>
  </Card>
</Box>

## Title

`CardTitle` takes a `labelChildren` slot above the title and a `description` slot below it. Put an icon before the title with `CardTitleMedia`, or in the `titleStart` and `titleEnd` slots.

The title is a heading. Inside a [Section](/components/Heading), it is one level below the section's heading; otherwise it is an `h3`. Set `headingLevel` to fit the page outline.

<Box maxWidth="20rem">
  <Card>
    <CardHeader>
      <CardTitleMedia>
        <Report size={20} />
      </CardTitleMedia>
      <CardTitle>
        <svelte:fragment slot="labelChildren">Billing</svelte:fragment>
        Quarterly report
        <svelte:fragment slot="description">Updated 2 hours ago</svelte:fragment>
      </CardTitle>
    </CardHeader>
  </Card>
</Box>

### Truncate

Set `titleTruncate` to `true` to cut the title to one line, or to a number to clamp it to that many lines. Set `maxWidth` to choose where it cuts. `labelTruncate` and `descriptionTruncate` work the same way.

<Box maxWidth="20rem">
  <Card>
    <CardHeader>
      <CardTitle titleTruncate>
        Quarterly usage report for the production object storage account
      </CardTitle>
    </CardHeader>
  </Card>
</Box>

## Actions

Put `CardActions` in the `actions` slot of `CardHeader` for quick actions, with each button in a `CardAction`. They sit in the top corner, and the title leaves room for them.

<Box maxWidth="20rem">
  <Card>
    <CardHeader>
      <CardTitle>Quarterly report</CardTitle>
      <CardActions slot="actions">
        <CardAction>
          <Button
            kind="ghost"
            size="sm"
            icon={favorite ? StarFilled : Star}
            iconDescription={favorite ? "Remove from favorites" : "Add to favorites"}
            isSelected={favorite}
            on:click={() => (favorite = !favorite)}
          />
        </CardAction>
      </CardActions>
    </CardHeader>
    <CardBody>
      Usage grew 12% over the last quarter, led by object storage.
    </CardBody>
  </Card>
</Box>

### Footer actions

Set `actionSet` on `CardFooter` to fill the footer with `CardAction`s. The footer gets a top border and the actions share the row. Set `iconOnly` on a `CardAction` that holds an icon-only control, such as an [OverflowMenu](/components/OverflowMenu), so it keeps its width at the end of the row.

<Box maxWidth="20rem">
  <Card>
    <CardHeader>
      <CardTitle>Staging bucket</CardTitle>
    </CardHeader>
    <CardBody>1,204 objects, updated 2 hours ago.</CardBody>
    <CardFooter actionSet>
      <CardAction>
        <Button kind="secondary">Share</Button>
      </CardAction>
      <CardAction>
        <Button>Open</Button>
      </CardAction>
      <CardAction iconOnly>
        <OverflowMenu size="xl" flipped iconDescription="More options">
          <OverflowMenuItem text="Rename" />
          <OverflowMenuItem text="Duplicate" />
          <OverflowMenuItem danger text="Delete" />
        </OverflowMenu>
      </CardAction>
    </CardFooter>
  </Card>
</Box>

## AI label

Put an `AILabel` in the `decorator` slot to mark the card's content as AI-generated. The card shows the AI surface, and the label sits at the `"xs"` size in the header's top corner, below any media on top. On a clickable card, it sits beside the link or button, not inside it.

<Box maxWidth="20rem">
  <Stack gap={5}>
    <Card>
      <CardMedia slot="media" ratio="2x1">
        <img src="/card-media.svg" alt="" />
      </CardMedia>
      <AILabel slot="decorator">
        <p>Generated from 90 days of billing data.</p>
      </AILabel>
      <CardHeader>
        <CardTitle>Usage forecast</CardTitle>
      </CardHeader>
      <CardBody>Spend is projected to grow 12% next month.</CardBody>
    </Card>
    <Card clickable href="/components/AILabel">
      <AILabel slot="decorator">
        <p>Generated from 90 days of billing data.</p>
      </AILabel>
      <CardHeader>
        <CardTitle>Usage forecast</CardTitle>
      </CardHeader>
      <CardBody>Spend is projected to grow 12% next month.</CardBody>
    </Card>
  </Stack>
</Box>

### Horizontal

With media at the end, the label sits at the corner of the content, clear of the media.

<Box maxWidth="32rem">
  <Card horizontal mediaPosition="end">
    <CardMedia slot="media" mediaWidth="40%">
      <img src="/card-media.svg" alt="" />
    </CardMedia>
    <AILabel slot="decorator">
      <p>Generated from 90 days of billing data.</p>
    </AILabel>
    <CardHeader>
      <CardTitle>Usage forecast</CardTitle>
    </CardHeader>
    <CardBody>Spend is projected to grow 12% next month.</CardBody>
  </Card>
</Box>

## On a layer

Place the card in a [Layer](/components/Layer) to put it on the next surface, so it contrasts with the surface below.

<Layer withBackground>
  <Box padding={5}>
    <Box maxWidth="20rem">
      <Card>
        <CardHeader>
          <CardTitle>Quarterly report</CardTitle>
        </CardHeader>
        <CardBody>
          Usage grew 12% over the last quarter, led by object storage.
        </CardBody>
      </Card>
    </Box>
  </Box>
</Layer>

## Disabled

Set `disabled` to `true` to prevent interaction.

<Box maxWidth="20rem">
  <Card clickable disabled>
    <CardHeader>
      <CardTitle>Quarterly report</CardTitle>
    </CardHeader>
    <CardBody>This report is archived and can no longer be opened.</CardBody>
  </Card>
</Box>
