---
components: ["DevToolbar"]
description: A floating toolbar that turns the development aids on and off, with keyboard shortcuts and saved state.
---

## Install

The dev tools ship from their own entry, `carbon-components-svelte/devtools`, with their own stylesheet, so the main entry and the theme stylesheets carry none of their code. Load `devtools.css` with `all.css`, or the matching `devtools-<theme>.css` with a single-theme stylesheet, such as `devtools-g100.css` with `g100.css`.

Import both behind `import.meta.env.DEV`. The bundler then drops them from a production build entirely, script and styles:

```svelte
<script>
  const devtools = import.meta.env.DEV
    ? Promise.all([
        import("carbon-components-svelte/devtools"),
        import("carbon-components-svelte/css/devtools.css"),
      ]).then(([module]) => module)
    : null;
</script>

{#if devtools}
  {#await devtools then { DevToolbar }}
    <DevToolbar />
  {/await}
{/if}
```

A static `import { DevToolbar } from "carbon-components-svelte/devtools"` works too, for example in a dev-only route, but it ships in whatever bundle imports it.

## Basic

`DevToolbar` puts every development aid behind one switch each: the grid, baseline rows, text baselines, the layout inspector, the spacing, contrast, target-size, and overflow checks, and a right-to-left flip. Add it once, in development only, and leave it in the app.

It renders a [`GridOverlay`](/components/Grid#gridoverlay) and a [`LayoutInspector`](/components/LayoutInspector) for you, so you do not wire up either one.

To try every tool on a full app page built from Carbon components, see the [dev tools kitchen sink](/dev-tools-kitchen-sink).

Click a tool to turn it on; click again to turn it off. Hover or focus a tool to see its name and shortcut. The close button collapses the toolbar to a small tools button that counts the tools still on.

The toolbar is built from this library's own components: each group of tools is a small icon-only `ToggleButtonGroup`, so every tool has a tooltip with its name and shortcut, and arrow keys move between the tools in a group. The whole bar is one [`TooltipGroup`](/components/TooltipGroup): after the first tooltip opens, moving across the bar, even between groups, shows each tooltip at once. Collapse and expand are small ghost `Button`s, and the collapsed handle shows a `BadgeIndicator` with the number of tools still on. The bar itself is styled like a Carbon menu: `$layer-01` with the standard shadow.

<FileSource src="/framed/DevToolbar/DevToolbar" />

| Tool | Shortcut | What it turns on |
| --- | --- | --- |
| Grid columns | <DocKbd label="Alt" />+<DocKbd label="Shift" />+<DocKbd label="G" /> | `GridOverlay` columns and the breakpoint badge |
| Baseline rows | <DocKbd label="Alt" />+<DocKbd label="Shift" />+<DocKbd label="B" /> | 8px baseline rows |
| Text baselines | <DocKbd label="Alt" />+<DocKbd label="Shift" />+<DocKbd label="A" /> | Text baseline marks |
| Inspect on hover | <DocKbd label="Alt" />+<DocKbd label="Shift" />+<DocKbd label="I" /> | Box model, type and color tokens, contrast, and measuring on hover |
| Off-scale spacing | <DocKbd label="Alt" />+<DocKbd label="Shift" />+<DocKbd label="S" /> | Margin, padding, and gap off the spacing scale |
| Low contrast text | <DocKbd label="Alt" />+<DocKbd label="Shift" />+<DocKbd label="C" /> | Text below WCAG AA contrast |
| Small targets | <DocKbd label="Alt" />+<DocKbd label="Shift" />+<DocKbd label="T" /> | Interactive targets under 24px that sit too close to others |
| Overflow | <DocKbd label="Alt" />+<DocKbd label="Shift" />+<DocKbd label="O" /> | Horizontal scroll culprits and clipped content |
| Right-to-left | <DocKbd label="Alt" />+<DocKbd label="Shift" />+<DocKbd label="R" /> | `dir="rtl"` on the page |
| Show or hide the toolbar | <DocKbd label="Alt" />+<DocKbd label="Shift" />+<DocKbd label="D" /> | |

On macOS, <DocKbd label="Alt" /> is <DocKbd label="⌥ Option" />. Shortcuts are ignored while you type in a field. Set `shortcuts={false}` to turn them off.

On Windows, <DocKbd label="Alt" />+<DocKbd label="Shift" /> alone switches the keyboard layout. The shortcuts with a letter still work. If the layout switch gets in the way, set `shortcuts={false}`.

The toolbar's names and tooltips are in English only. That is fine for a developer tool, which only your team sees.

The checks look only near the viewport, so their counts cover the visible area plus one screen above and below, not the whole page. See [Page checks](/components/LayoutInspector#page-checks).

## Saved state

The toolbar saves which tools are on, and whether it is expanded, to `localStorage`, so they survive a reload. Set `persistKey` to keep separate state per app on the same origin, or `persist={false}` to start fresh on every load.

## Configure the tools

Pass props through to the overlay and the inspector with `gridProps` and `inspectorProps`. The toolbar owns `open` and the on/off props for each tool; everything else is yours. Both are typed as the props of `GridOverlay` and `LayoutInspector`, so your editor completes them. This example starts the rows below a 48px UI Shell header, measures with <DocKbd label="Shift" />, and docks the inspector card in the corner.

<FileSource src="/framed/DevToolbar/DevToolbarConfigure" />

Set `baseline` in `gridProps` to change the row step from 8px. To skip third-party widgets in the checks, set `checkIgnore` in `inspectorProps` to a selector that matches them. The inspector's color and type checks read the page's `--cds-*` custom properties, so token names need a stylesheet that defines them, such as `all.css`.

## Presets

Bind `tools` to read or set the toolbar from outside, for example to turn on a set of tools at once.

<FileSource src="/framed/DevToolbar/DevToolbarPresets" />

To react only when a person turns a tool on or off, listen to `change`. It fires from a toolbar click or a shortcut, with the full `tools` object in `event.detail`. It does not fire when you set `tools` from outside.

```svelte
<DevToolbar on:change={(e) => console.log("Tools on:", e.detail)} />
```

## Right-to-left

The RTL tool sets `dir="rtl"` on the `<html>` element, to catch layouts that use physical sides (`margin-right`) where they need logical ones (`margin-inline-end`). Turning it off restores the page; if the page was already right-to-left, the toolbar leaves it alone. The bar itself always reads left to right, and so do the inspector card and the grid badge, so measurements like `16.4:1` keep their order. A subtree inside a [`LayoutDirection`](/components/LayoutDirection) keeps its own `dir`; the RTL tool cannot flip it.

<FileSource src="/framed/DevToolbar/DevToolbarRtl" />
