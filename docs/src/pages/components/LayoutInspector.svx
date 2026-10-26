---
components: ["LayoutInspector"]
description: A development aid that shows the box model, Carbon spacing and type tokens, and distances between elements, and flags off-scale spacing and small targets.
---

## Setup

`LayoutInspector` answers the questions a design review asks: is this padding a spacing token, how far apart are these two elements, which type style is this text. Turn it on, hover the page, and read the answers in place.

`LayoutInspector` is a developer tool. Import it from `carbon-components-svelte/devtools` and load `devtools.css` (or `devtools-<theme>.css`); see [Install](/components/DevToolbar#install).

The inspector is a fixed, `pointer-events: none` layer, so the page stays fully clickable while it is open. Like [`GridOverlay`](/components/Grid#gridoverlay), it never toggles itself; the caller owns `open`.

| Do | Why |
| --- | --- |
| Import it only in development | It reads computed styles of the hovered element on every pointer move, and the page checks scan again as the page changes |
| Pair it with `GridOverlay` | The grid shows where things should go; the inspector shows the numbers behind where they are |

## Spacing

Hover any element to see its box model, the way browser devtools draw it: magenta for margin, green for padding, blue for the content box. Each side is labeled with its value. Labels on the Carbon spacing scale (2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 160 px) use the box color; a red label is off the scale.

A card next to the element names the tokens, so `16` reads as `spacing-05`. For flex and grid containers, it also shows the `gap`.

<FileSource src="/framed/LayoutInspector/LayoutInspector" />

### On and off the scale

The scale is checked in `rem`, so it follows the root font size. Negative margins match by size.

Carbon measures padding from the outer edge, so a bordered control takes its border off its padding. A Carbon button has 15px of left padding and a 1px border: 16px, `spacing-05`. When padding alone is off the scale but padding plus border is on it, the card shows the token with "With its 1px border", and `checkSpacing` does not flag it.

Carbon's own components keep a few deliberate off-scale values, such as the small button's 60px right padding, which leaves room for an icon. You cannot change them, so on a Carbon element they read "set by Carbon" in neutral text instead of a red "off-scale". Set `checkCarbon` to flag them too.

<FileSource src="/framed/LayoutInspector/LayoutInspectorSpacing" />

## Measure

Hover an element, hold <DocKbd label="Alt" />, then hover a second element. On a Mac, <DocKbd label="Alt" /> is the <DocKbd label="⌥ Option" /> key. The inspector draws the distances between them, each labeled with its token:

- Side by side or stacked: the gap between them.
- One inside the other: the distance from each inner edge to the matching outer edge.
- Overlapping: the distance between each pair of edges that differ.

Release the key to go back to the box model. In these docs, click inside an example first so its frame receives key presses.

Set `measureKey` to choose the key: `"Alt"` (the default), `"Shift"`, `"Control"`, or `"Meta"`. Use `"Shift"` on a keyboard without <DocKbd label="Alt" /> or <DocKbd label="⌥ Option" />, or when <DocKbd label="Alt" /> shortcuts in your app get in the way. The card's hint names the current key.

<FileSource src="/framed/LayoutInspector/LayoutInspectorMeasure" />

Set `measure={false}` to turn measuring off.

## Type

Hover text to see its Carbon type token. The inspector matches font size, line height, weight, letter spacing, and family against the library's own `bx--type-*` classes, measured at the current viewport, so responsive tokens match at every breakpoint. Some tokens are aliases with identical values, such as `label-01` and `legal-01`; the card lists all matches. Text that matches no token says "no token", with its size, line height, and weight.

<FileSource src="/framed/LayoutInspector/LayoutInspectorType" />

Set `typography={false}` to hide the type row.

## Colors and contrast

Hover an element to see its colors on the card:

- **text**: the text color, for elements with their own text.
- **bg**: the background actually behind the element. If the element is transparent, this is the nearest ancestor's background, marked "inherited".
- **border**: the border color, if the element has a border.
- **contrast**: the WCAG contrast of the text against that background, rated AAA, AA, or "fails AA". Large text (24px, or 18.66px bold) needs 3:1 for AA; other text needs 4.5:1.

Each color is named with the Carbon theme token that resolves to it, best fit for its role first, so a text color reads as `text-primary` before `icon-primary`. A color that matches no token is "off-palette". Token names come from the page's `--cds-*` custom properties, so they need a stylesheet that defines them, such as `all.css`; with a single-theme stylesheet the card shows plain values. The names refresh when a stylesheet is added, such as a theme that loads later.

The inspector cannot see what a background image or gradient looks like, so over one it reports the contrast as unknown, and `checkContrast` skips that text. Check it by hand.

<FileSource src="/framed/LayoutInspector/LayoutInspectorColors" />

Set `colors={false}` to hide the color rows.

## Page checks

Four checks outline problems across the page, not only on the hovered element. Each one is off by default. A badge in the corner counts what each check finds.

| Prop | Outlines |
| --- | --- |
| `checkSpacing` | Margin, padding, or gap off the spacing scale |
| `checkContrast` | Text below WCAG AA contrast |
| `checkTargets` | Interactive targets that are too small and too close to others |
| `checkOverflow` | Elements that cause horizontal scroll, and clipped content |

By default, every check skips Carbon's own components: elements with a `bx--` class and their unstyled inner elements, such as the `<input>` inside `NumberInput`. This keeps the checks on your code. Set `checkCarbon` to check Carbon's components too, for example to check a custom theme. Set `checkIgnore` to a CSS selector to skip more elements, and everything inside them, such as third-party widgets.

The checks scan only near the viewport: the visible area plus one screen above and below. They scan again when the page changes, at most a few times a second while the browser is idle, and when scrolling leaves that area. So the counts in the badge are for that area, not the whole page.

When marks of one check sit so close that their labels would collide, as in a row of small icon buttons, they share one label on the first mark, such as "16 × 16 · +2 more". Each mark keeps its outline.

## Spacing check

Set `checkSpacing` to outline every element whose margin, padding, or gap is off the spacing scale, labeled with the values that missed.

Carbon uses a few deliberate off-scale values, so this check skips Carbon's components unless `checkCarbon` is set. Turn on the toggle in this example to see them.

A 1px margin or padding reads as a hairline, not off-scale. The scale starts at 2px, and a `-1px` margin is how borders overlap.

<FileSource src="/framed/LayoutInspector/LayoutInspectorLint" />

Browsers report `auto` margins as pixel values, so the check cannot tell them apart from set ones. It skips equal left and right margins (centering) and margins wider than the largest token (160px). A one-sided `margin-left: auto` narrower than that is still flagged.

## Contrast check

Set `checkContrast` to outline all text below WCAG AA, labeled with its ratio and the ratio it needs. Text inside disabled controls is exempt, as WCAG allows.

Some components paint a fill on a `::before` or `::after`, such as a selected `ContentSwitcher` button. The check counts a visible pseudo-element that covers the element as its background.

<FileSource src="/framed/LayoutInspector/LayoutInspectorContrast" />

## Target size

Set `checkTargets` to outline interactive elements that fail WCAG 2.2 target size (2.5.8), labeled with their size. The default `targetSize` of `24` is the AA minimum; `44` is the AAA size (2.5.5).

A target smaller than `targetSize` in either direction can still pass on spacing, as WCAG allows. Picture a circle `targetSize` wide centered on the small target. If that circle touches no other target, and no other small target's circle, the target passes. So a list of small controls with room between them is not flagged.

A control's `<label>` counts toward its target, so a checkbox with a visually hidden input, like Carbon's `Checkbox`, still passes. Links inside running text are exempt, as WCAG allows: an inline element whose parent also holds text is skipped. Skipped elements, such as Carbon's components, still count as neighbors in the spacing test.

<FileSource src="/framed/LayoutInspector/LayoutInspectorTargets" />

## Overflow

Set `checkOverflow` to find two kinds of overflow:

- **Horizontal page scroll.** When the page scrolls sideways, the inspector outlines the elements that cause it: those that reach past the page's edge while their parent does not, labeled with how far. Elements inside a box that clips or scrolls are left out, since they cannot widen the page.
- **Clipped content.** Boxes with `overflow: hidden` or `clip` whose content does not fit, labeled with how much is hidden. Text cut off with `text-overflow: ellipsis` is labeled "truncated". Boxes that scroll are left alone, since their content is reachable.

A box that clips content no one can see, such as a collapsed menu whose items are `inert` or `visibility: hidden`, is not flagged.

<FileSource src="/framed/LayoutInspector/LayoutInspectorOverflow" />

## Card

The info card is a single element, reused as you move from one element to the next, with a fixed width so it does not resize as its content changes.

Set `cardPlacement` to choose where the card goes:

| Value | Behavior |
| --- | --- |
| `"cursor"` (default) | Follows the pointer, below and to the right. Near the right or bottom edge it flips to the other side, and it flips back only once there is clear room, so it does not jitter at an edge. |
| `"corner"` | Stays docked in the bottom-right corner, so nothing moves while you read. It moves to the bottom-left while the pointer is near it. |

<FileSource src="/framed/LayoutInspector/LayoutInspectorCard" />

## Hover delay

The box model waits for the pointer to rest before it appears, so sweeping across the page does not flash it. The timing works like [`TooltipGroup`](/components/TooltipGroup), with the same prop names:

| Prop | Default | What it does |
| --- | --- | --- |
| `enterDelayMs` | `150` | How long the pointer must rest on one element before the box model first shows. The timer restarts on each new element. |
| `leaveDelayMs` | `100` | How long the box model stays after the pointer leaves every element, so crossing a gap between elements does not hide it. |
| `skipDelayMs` | `300` | How long after it hides that the box model comes back at once. |

Once the box model shows, moving to another element updates it at once. Measuring never waits. Set `enterDelayMs` to `0` to show the box model at once.

<FileSource src="/framed/LayoutInspector/LayoutInspectorDelay" />

## Theming

Every color, type style, and spacing value in the inspector is a Carbon token.

- **Annotations** are the box model, distances, and page marks. Each kind uses a Carbon Tag token pair, which adapts to the theme and is tested for contrast: the Tag background for fills and label backgrounds, and the Tag text color for lines and label text. Labels are small Carbon Tags (`label-01`, 18px, pill radius). The content box uses `$highlight` and `$interactive`, Carbon's selection colors. Tokens are opaque, so the box model fills fade as whole layers to keep the page visible.
- **Chrome** is the card and the summary badge. It is built like Carbon's default `Popover`: `$layer`, the standard shadow, and a 2px radius, with a 288px card. Color and type both step down: the element name, labels, and main values use `$text-primary`, the size `$text-secondary`, supporting details such as token names `$text-helper`, and problems `$text-error`. Everything is flush left and all sans: the name in `heading-compact-02`, labels in bold `heading-compact-01`, main values in `body-compact-01`, details in `helper-text-01`, and the contrast verdict in `heading-compact-01`. Facts sit 16px apart, with 24px around the header and hint and 4px between a label and its value.

Carbon's palette has no orange Tag, so margins are magenta rather than the orange of browser devtools.

Override any color with custom properties on the inspector, through `class` or `style`. Each takes any CSS color, including another token such as `var(--cds-tag-background-blue)`.

| Kind | Fill | Line and label text |
| --- | --- | --- |
| Margin | `--ccs-layout-inspector-margin-fill`: `tag-background-magenta` | `--ccs-layout-inspector-margin-ink`: `tag-color-magenta` |
| Padding | `--ccs-layout-inspector-padding-fill`: `tag-background-green` | `--ccs-layout-inspector-padding-ink`: `tag-color-green` |
| Content | `--ccs-layout-inspector-content-fill`: `$highlight` | `--ccs-layout-inspector-content-ink`: `$interactive` |
| Measure | `--ccs-layout-inspector-measure-fill`: `tag-background-purple` | `--ccs-layout-inspector-measure-ink`: `tag-color-purple` |
| Off-scale labels | `--ccs-layout-inspector-off-fill`: `tag-background-red` | `--ccs-layout-inspector-off-ink`: `tag-color-red` |
| Spacing check | `--ccs-layout-inspector-spacing-fill`: `tag-background-red` | `--ccs-layout-inspector-spacing-ink`: `tag-color-red` |
| Contrast check | `--ccs-layout-inspector-contrast-fill`: `tag-background-cyan` | `--ccs-layout-inspector-contrast-ink`: `tag-color-cyan` |
| Targets | `--ccs-layout-inspector-target-fill`: `tag-background-teal` | `--ccs-layout-inspector-target-ink`: `tag-color-teal` |
| Overflow | `--ccs-layout-inspector-overflow-fill`: `tag-background-cool-gray` | `--ccs-layout-inspector-overflow-ink`: `tag-color-cool-gray` |

| Card | Default |
| --- | --- |
| `--ccs-layout-inspector-card-background` | `$layer` |
| `--ccs-layout-inspector-card-text` | `$text-primary` |
| `--ccs-layout-inspector-card-text-secondary` | `$text-secondary`, for the size |
| `--ccs-layout-inspector-card-text-helper` | `$text-helper`, for supporting details |
| `--ccs-layout-inspector-card-error` | `$text-error`, for failures and off-scale values |
| `--ccs-layout-inspector-card-border` | `$border-strong`, around color swatches |

The `GridOverlay` breakpoint badge uses the same surface.

<FileSource src="/framed/LayoutInspector/LayoutInspectorTheming" />

In forced colors (Windows contrast themes), the card and summary get an outline, the box model draws margin in `Highlight` and padding in `GrayText`, labels read `CanvasText` on `Canvas`, and color swatches keep the real color they name. Off-scale labels invert, so they still stand out.

On a right-to-left page, the card and labels still read left to right, so values like `#161616` and `16.4:1` keep their order.

## With GridOverlay

To get every tool behind one toolbar, use [`DevToolbar`](/components/DevToolbar) instead. To wire them up yourself, use both together, each behind its own shortcut. This example keeps both settings in `LocalStorage`.

<FileSource src="/framed/LayoutInspector/LayoutInspectorWithGridOverlay" />

To keep both out of production builds, import them only in development. See [Install](/components/DevToolbar#install).

## Playground

To try every check on a full app page, see the [dev tools kitchen sink](/dev-tools-kitchen-sink).


Try every option together. The card on the right has a few off-scale values and a small link on purpose.

<FileSource src="/framed/LayoutInspector/LayoutInspectorPlayground" />
