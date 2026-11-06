---
description: ThemeZone renders part of a page in another Carbon theme, such as a dark sidebar in a light app.
---

<script>
  import { Box, TextInput, ThemeZone } from "carbon-components-svelte";
</script>

## Basic

[Theme](/components/Theme) sets the theme for the whole page. `ThemeZone` sets it for one part of the page. It paints the theme's background and text color, and every component inside it takes the theme's tokens. It matches Carbon React's scoped `<Theme>`.

`ThemeZone` needs `all.css`, which declares every theme as CSS custom properties. The single-theme stylesheets (`white.css`, `g100.css`, and the others) compile one theme's values into the rules, so a zone has nothing to switch.

```js
import "carbon-components-svelte/css/all.css";
```

Set `theme` to one of the five themes, or to `"system"`. Use `tag` to render another element, such as `aside` or `section`.

<ThemeZone theme="g100">
  <Box padding={5}>
    <TextInput labelText="Name" placeholder="On Gray 100" />
  </Box>
</ThemeZone>

## Dark sidebar in a light app

A Gray 100 sidebar keeps its theme whatever the page theme is. Switch the docs theme to see the rest of the example follow it.

<FileSource src="/framed/ThemeZone/ThemeZoneSidebar" />

## Nested zones

Zones nest. Each one takes its theme's full token set, so a White zone inside a Gray 100 zone looks the same as a White page.

<FileSource src="/framed/ThemeZone/ThemeZoneNested" />

## System color scheme

Set `theme` to `"system"` to follow the operating system color scheme with CSS alone. The zone is White when the system is light and Gray 100 when it is dark. It switches as soon as the setting changes. See [Theme](/components/Theme#follow-the-system-with-css-only) to do the same for the whole page.

<FileSource src="/framed/ThemeZone/ThemeZoneSystem" />

## Layers

A zone starts a new layer stack, as in Carbon React. The zone's surface is the page surface, so a `Layer` inside it is layer 2, even when the zone itself sits in a `Layer`.

<FileSource src="/framed/ThemeZone/ThemeZoneLayer" />

## Portalled content

Menus, tooltips, and other floating content that render in a portal leave the zone in the DOM. They keep the zone's theme anyway: the portal takes the zone's theme class. This covers `portalMenu` on Dropdown, ComboBox, and MultiSelect, and every component that portals a tooltip or menu.

<FileSource src="/framed/ThemeZone/ThemeZonePortalMenu" />

## Custom tokens

A zone declares its theme's stock tokens. Overrides that `Theme`'s `tokens` prop sets on `<html>` don't reach inside a zone. To customize a zone, set the custom properties on it.

<ThemeZone theme="g100" style="--cds-focus: #ff7eb6">
  <Box padding={5}>
    <TextInput labelText="Focus me" placeholder="Pink focus ring" />
  </Box>
</ThemeZone>
