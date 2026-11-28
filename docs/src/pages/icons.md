---
title: Icons
layout: guide
description: Swap the icons components draw themselves, such as a dropdown's chevron or a field's warning, for icons of your own.
---

## Swap built-in icons

Components draw some icons themselves: the chevron of a `Dropdown` or an `AccordionItem`, the warning beside an invalid field, the close button of a `Modal`. Call `setIconContext` once, in your root layout, with the icons to swap by name. Every component below it draws your icon wherever it draws that name, with the props and classes it gives the built-in one, so size, color and placement stay. A name you don't set keeps the built-in icon.

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import { setIconContext } from "carbon-components-svelte";
  import CaretDown from "carbon-icons-svelte/lib/CaretDown.svelte";
  import CaretRight from "carbon-icons-svelte/lib/CaretRight.svelte";

  setIconContext({ ChevronDown: CaretDown, ChevronRight: CaretRight });
</script>

<slot />
```

<FileSource src="/framed/Icons/SwapIcons" />

A swap applies to every component that draws the name, or to none, so one `Close` covers modals, notifications, tags and the UI shell alike. An icon you pass to a component, such as `Search`'s `icon`, still wins over the swapped one. Call `setIconContext` again lower in the tree to swap more icons for one part of the app; it adds to the icons set above it.

## Names

Names match `carbon-icons-svelte`, so an icon imported under its own name fits as a shorthand: `setIconContext({ Close })`. The `IconName` type lists every name. These are the ones most components draw:

| Name | Drawn by |
| :--- | :--- |
| `WarningFilled` | Invalid fields, such as `TextInput`, `Dropdown` and `DatePicker` |
| `WarningAltFilled` | Fields with a warning |
| `Close` | Close buttons of `Modal`, `SidePanel`, notifications and `Tag`, and clear buttons of `Search` and `ComboBox` |
| `ChevronDown` | `Dropdown`, `ComboBox`, `MultiSelect` and `Select` menus |
| `ChevronRight` | `AccordionItem`, `Disclosure`, `Carousel` and expandable `DataTable` rows |
| `CheckmarkFilled` | Success states, such as notifications, `ProgressBar` and `RadioTile` |
| `Checkmark` | Selected items of `Dropdown`, `ComboBox` and menus |

## Cost

Each component that draws an icon reads the context once as it mounts. With no `setIconContext` above it, it draws the built-in icon, as before.
