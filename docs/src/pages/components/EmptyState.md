---
components: ["EmptyState"]
description: Empty states fill a panel, card or table that has nothing to show yet, with an illustration, a title, a line of explanation and the action that fills it.
---

<script>
  import { Button, EmptyState } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Folder from "carbon-icons-svelte/lib/Folder.svelte";
  import Locked from "carbon-icons-svelte/lib/Locked.svelte";
  import Search from "carbon-icons-svelte/lib/Search.svelte";
</script>

## Basic

Give the empty state a `title`, a `subtitle` that says why it's empty, and the action that fills it in the default slot. Put an icon or pictogram in the `illustration` slot; it is hidden from screen readers.

<EmptyState
  title="Create your first project"
  subtitle="Projects hold the files, comments and people for one piece of work."
>
  <Folder slot="illustration" />
  <Button icon={Add}>Create project</Button>
  <Button kind="ghost">Import files</Button>
</EmptyState>

## No results

For a search or filter with no matches, offer a way back. Set `role="status"` so screen readers announce it when the results empty out.

<EmptyState
  role="status"
  title="No results for “invoces”"
  subtitle="Check the spelling, or try a shorter, broader term."
>
  <Search slot="illustration" />
  <Button kind="tertiary">Clear search</Button>
</EmptyState>

## Subtitle slot

Use the `subtitleChildren` slot for a subtitle with a link. `titleChildren` does the same for the title.

<EmptyState title="You don't have access to Billing">
  <Locked slot="illustration" />
  <svelte:fragment slot="subtitleChildren">
    Ask a workspace admin, or <a href="#roles">read about roles</a>.
  </svelte:fragment>
  <Button kind="tertiary">Request access</Button>
</EmptyState>

## Small size

Set `size` to `"sm"` in a card, drawer or table body.

<EmptyState size="sm" title="Your bag is empty" subtitle="Items you add show up here.">
  <Folder slot="illustration" />
  <Button kind="tertiary" size="small">Continue shopping</Button>
</EmptyState>

## Heading level

Inside a [Section](/components/Heading), the title is one level below the section's heading; elsewhere it is an `h3`. Set `headingLevel` to fit the page outline.

<EmptyState headingLevel={2} title="No reports yet" subtitle="Reports you schedule appear here." />
