---
components: ["Search", "SearchSkeleton", "FluidSearchSkeleton"]
description: Search provides a flexible search input, with support for expandable and fluid variants, multiple sizes, and custom icons.
---

<script>
  import Information from "carbon-icons-svelte/lib/Information.svelte";
  import Query from "carbon-icons-svelte/lib/Query.svelte";
  import { Box, FluidSearchSkeleton, Layer, Search, TooltipIcon } from "carbon-components-svelte";
</script>

## Basic

The search input is 40px tall by default, like other fields. Set `size` to choose another variant — see [extra-large](#extra-large), [small](#small), and [extra-small](#extra-small). The input clears on <DocKbd label="Escape" /> or the clear button.

To build a search typeahead with a results menu — suggestions, grouped results, and recent searches — use [SearchMenu](/components/SearchMenu), which composes `Search`.

<Search />

## Helper text

Provide context below the input with `helperText`.

<Search labelText="Search catalog" helperText="Searches every connected data catalog" />

## Initial value

Set an initial value with `value`.

<Search placeholder="Search catalog..." value="Cloud functions" />

## Reactive example

Bind to `value` for reactive updates.

<FileSource src="/framed/Search/SearchReactive" />

## Select on focus

Set `selectTextOnFocus` to select the full value when the field receives focus.

<Search selectTextOnFocus placeholder="Search catalog..." value="Cloud functions" />

## Clear event

The `clear` event fires when clicking the clear button or pressing <DocKbd label="Escape" />.

<Search value="Cloud functions" on:clear={() => console.log('clear')}/>

## Search event

The `search` event fires when pressing <DocKbd label="Enter" />, with `value` as the event detail. Set `debounce` (milliseconds) to also dispatch `search` after typing pauses, without delaying the `value` binding itself. The default `debounce` of `0` does not dispatch on input — only <DocKbd label="Enter" /> does.

<Search debounce={300} on:search={(e) => console.log(e.detail)} />

## Custom labels

Customize the ARIA labels used for accessibility.

### Landmark label

The outer element has `role="search"`, and its accessible name comes from `labelText` via `aria-labelledby`, not a static `aria-label`. The label is visually hidden by default — see [Fluid](#fluid) for the variant with a visible label. Always set a descriptive `labelText`, especially when a page has more than one search region, so screen reader users can distinguish each landmark by name.

<Search labelText="Search catalog" />

### Close button label

Set `closeButtonLabelText` to customize the accessible label of the clear button (default `"Clear search input"`).

<Search value="Cloud functions" closeButtonLabelText="Clear catalog search" />

## Keyboard shortcut

Set `shortcut` to focus the field from anywhere on the page, such as `"/"` or `"mod+k"` (`mod` is Command on Apple platforms and Ctrl elsewhere). The keys show at the end of the empty field until it's focused, and the input announces them with `aria-keyshortcuts`. A key without a modifier, such as `/`, doesn't fire while typing in another field. An expandable search expands first, and its search button announces the keys while it's collapsed. To do something else, handle `on:shortcut` and call `preventDefault()`.

This site already uses <DocKbd label="/" /> and <DocKbd label="⌘" />+<DocKbd label="K" /> for its own search, so the example uses `"mod+shift+f"`.

<Search shortcut="mod+shift+f" placeholder="Search components" />

Let users turn off a single-key shortcut such as `/`, or add a modifier to it. Speech input and stray key presses fire it by accident, and WCAG 2.1.4 asks for a way to turn it off or remap it.

## Expandable

Enable the expandable variant to show a compact search icon that expands on focus. While collapsed, the input is marked `inert` and removed from the tab order, hiding it from assistive technology until it expands — only the search icon button is reachable. That icon renders as a `<button>`, so pressing <DocKbd label="Enter" /> opens the field without a pointer. Pressing <DocKbd label="Escape" /> clears a non-empty value first, then collapses the field on the next press.

<FileSource src="/framed/Search/SearchExpandableReactive" />

## On a layer

Place the component in a [`Layer`](/components/Layer) to put it on the next surface, so it contrasts with the surface below. `Layer` replaces the v10 `light` prop.

<Layer withBackground>
  <Box padding={5}>
    <Search />
  </Box>
</Layer>

## Fluid

Set `fluid` to embed a visible label inside the field. Fluid search inputs work
standalone or inside [FluidForm](/components/FluidForm), which applies the
variant automatically. The fluid variant has a fixed height and cannot be combined
with the expandable variant.

<Search fluid labelText="Search catalog" placeholder="Search services..." />

### Custom label

Use the `labelChildren` slot to render custom label content, such as a
tooltip icon.

<Search fluid labelText="Search catalog" placeholder="Search services...">
  <svelte:fragment slot="labelChildren">
    Search catalog
    <TooltipIcon tooltipText="Search applies to services in the selected region only." icon={Information} />
  </svelte:fragment>
</Search>

### Disabled

<Search fluid disabled labelText="Search catalog" placeholder="Search services..." />

### Skeleton

Display a loading skeleton for the fluid search variant.

<FluidSearchSkeleton />

## Sizes

Set `size` to control the input height. The default is `"lg"`, 40px.

Carbon v11's `"md"` also works and renders the default 40px `"lg"` size. Carbon v11's 48px `lg` is `"xl"` here.

### Extra-large

Set `size` to `"xl"` for a 48px search input.

<Search size="xl" />

### Small

Set `size` to `"sm"` for a small search input.

<Search size="sm" />

### Extra-small

Set `size` to `"xs"` for an extra-small search input.

<Search size="xs" />

## States

Reflect validation and interaction states.

### Invalid

Indicate an invalid state with an error message by setting `invalid` and providing `invalidText`.

<Search invalid invalidText="Enter at least 3 characters to search the catalog." labelText="Search catalog" value="db" />

### Warning

Indicate a warning state with a message by setting `warn` and providing `warnText`.

<Search warn warnText="Results may be up to 5 minutes behind the primary index." labelText="Search catalog" value="billing-api" />

### Disabled

Set `disabled` to `true` to prevent user interaction.

<Search disabled />

### Read-only

Set `readonly` to show a value that cannot be edited or cleared. The clear
button is hidden and <DocKbd label="Escape" /> leaves the value in place. A
read-only search still submits its value with the form.

<Search readonly value="Carbon" />

## Custom icon

Replace the default search icon with a custom one.

<Search icon={Query} />

## Loading

Set `loading` to show a small spinner in place of the search icon while
results are loading. The input stays editable and gets `aria-busy="true"`.

Set `loadingDelay` to wait a number of milliseconds after `loading` becomes
`true` before showing the spinner. Work that finishes within the delay shows
no spinner. Once shown, the spinner stays for at least 500 ms so it does not
flash. The input gets `aria-busy` as soon as `loading` is `true`.

<Search loading value="Cloud functions" />

## Skeleton

Show a loading state with the skeleton variant.

<Search skeleton />

### Extra-large

Show a loading state for the extra-large search variant.

<Search size="xl" skeleton />

### Small

Show a loading state for the small search variant.

<Search size="sm" skeleton />

### Extra-small

Show a loading state for the extra-small search variant.

<Search size="xs" skeleton />
