---
description: Text applies Carbon typography to any element — type scale, semantic color, and layout modifiers, for productive and expressive styles.
---

<script>
  import { Box, Stack, Text, Toggle, Truncate } from "carbon-components-svelte";
</script>

## Basic

The default component renders a `<p>` with the body-01 type style.

<Text>Carbon Components Svelte implements the Carbon Design System.</Text>

## Text color

### Semantic tokens

Set `color` to a Carbon semantic text token. Each token describes intent and resolves to the active theme, so colors update when the theme changes.

| Token         | Description                                                   |
| ------------- | ------------------------------------------------------------- |
| `primary`     | Primary text for headings and body copy                       |
| `secondary`   | Secondary text for supplementary copy                         |
| `placeholder` | Placeholder text in form inputs                               |
| `helper`      | Helper and caption text                                       |
| `on-color`    | Text on a colored background, such as a button or tag         |
| `inverse`     | Text on an inverse surface, such as a tooltip or notification |
| `error`       | Error and validation text                                     |
| `success`     | Success and positive status text                              |
| `link`        | Link-colored text that is not itself a link                   |
| `disabled`    | Disabled text                                                 |

Carbon v11 has no success text token, and its `support-success` color is too light for small text. `success` reads `--ccs-text-success`, a green that meets 4.5:1 wherever `error` does: on the page background and the first two layers. Override it with CSS, such as `:root { --ccs-text-success: #0e6027; }`; the `Theme` `tokens` prop only sets Carbon's `--cds-*` tokens.

<Text color="primary">Primary text</Text>
<Text color="secondary">Secondary text</Text>
<Text color="placeholder">Placeholder text</Text>
<Text color="helper">Helper text</Text>
<Text color="error">Error text</Text>
<Text color="success">Success text</Text>
<Text color="link">Link text</Text>
<Text color="disabled">Disabled text</Text>

### Inherit type

Set `type="inherit"` to color or weight text without resetting its size, for example inside a component slot that already has its own type style.

<Toggle labelText="Automatic backups">
  <Text slot="labelA" tag="span" type="inherit" color="error">Off</Text>
  <Text slot="labelB" tag="span" type="inherit" color="success">On</Text>
</Toggle>

### On-color and inverse surfaces

On-color and inverse tokens are meant for colored or inverse surfaces, where the default text tokens would be unreadable. Both read light in the white theme but track different surfaces, so they diverge in other themes. Each example places the token on the surface it is designed for.

Use `on-color` for text on a colored background, such as a button or tag fill:

<Box fill="brand" padding={5}>
  <Text color="on-color">Text on a colored background</Text>
</Box>

Use `inverse` for text on an inverse surface, such as a tooltip or notification:

<Box fill="inverse" padding={5}>
  <Text color="inverse">Text on an inverse surface</Text>
</Box>

## Type styles

Set `type` to a Carbon v11 type token. The scale covers supporting text, body copy, fixed headings for product UI, and fluid styles that scale with the viewport for editorial layouts.

| Token                | Description                                              |
| -------------------- | -------------------------------------------------------- |
| `label-01`           | Form field and UI labels                                 |
| `label-02`           | Label text, one step larger                              |
| `helper-text-01`     | Helper text beneath form inputs                          |
| `helper-text-02`     | Helper text, one step larger                             |
| `legal-01`           | Legal and fine-print text                                |
| `legal-02`           | Legal text, one step larger                              |
| `body-compact-01`    | Dense, single-line body text                             |
| `body-compact-02`    | Dense body text, one step larger                         |
| `body-01`            | Paragraph body text for multiple lines                   |
| `body-02`            | Paragraph body text, one step larger                     |
| `code-01`            | Inline code set in IBM Plex Mono                         |
| `code-02`            | Code text, one step larger                               |
| `heading-compact-01` | Dense heading, step 1 (smallest)                         |
| `heading-compact-02` | Dense heading, step 2                                    |
| `heading-01`         | Heading scale, step 1                                    |
| `heading-02`         | Heading scale, step 2                                    |
| `heading-03`         | Heading scale, step 3                                    |
| `heading-04`         | Heading scale, step 4                                    |
| `heading-05`         | Heading scale, step 5                                    |
| `heading-06`         | Heading scale, step 6 (light weight)                     |
| `heading-07`         | Heading scale, step 7 (largest, light weight)            |
| `fluid-heading-03`   | Fluid heading, step 3                                    |
| `fluid-heading-04`   | Fluid heading, step 4                                    |
| `fluid-heading-05`   | Fluid heading, step 5                                    |
| `fluid-heading-06`   | Fluid heading, step 6 (largest)                          |
| `fluid-paragraph-01` | Fluid paragraph for editorial layouts                    |
| `fluid-quotation-01` | Fluid quotation set in IBM Plex Serif                    |
| `fluid-quotation-02` | Quotation, one step larger                               |
| `fluid-display-01`   | Fluid display text                                       |
| `fluid-display-02`   | Display text, one step larger                            |
| `fluid-display-03`   | Display text, one step larger                            |
| `fluid-display-04`   | Display text (largest)                                   |

### Supporting text

Labels, helper text, and legal text support the smallest UI elements.

<Text type="label-01">Label 01</Text>
<Text type="label-02">Label 02</Text>
<Text type="helper-text-01">Helper text 01</Text>
<Text type="helper-text-02">Helper text 02</Text>
<Text type="legal-01">Legal 01</Text>
<Text type="legal-02">Legal 02</Text>

### Body text

`body-compact` styles suit dense, single-line text; `body` styles suit multi-line paragraphs.

<Text type="body-compact-01">Body compact 01</Text>
<Text type="body-compact-02">Body compact 02</Text>
<Text type="body-01">Body 01</Text>
<Text type="body-02">Body 02</Text>

### Code

Set in IBM Plex Mono.

<Text tag="code" type="code-01">const carbon = "components-svelte";</Text>
<Text tag="pre" type="code-02">const carbon = "components-svelte";</Text>

### Headings

Fixed sizes for application UI. `heading-compact` styles use tighter line heights for dense layouts.

<Text tag="h6" type="heading-compact-01">Heading compact 01</Text>
<Text tag="h5" type="heading-compact-02">Heading compact 02</Text>
<Text tag="h6" type="heading-01">Heading 01</Text>
<Text tag="h5" type="heading-02">Heading 02</Text>
<Text tag="h4" type="heading-03">Heading 03</Text>
<Text tag="h3" type="heading-04">Heading 04</Text>
<Text tag="h2" type="heading-05">Heading 05</Text>
<Text tag="h2" type="heading-06">Heading 06</Text>
<Text tag="h1" type="heading-07">Heading 07</Text>

### Fluid type

Sizes that scale with the viewport, for editorial layouts.

<Text type="fluid-paragraph-01">Fluid paragraph 01</Text>
<Text tag="h3" type="fluid-heading-03">Fluid heading 03</Text>
<Text tag="h2" type="fluid-heading-04">Fluid heading 04</Text>
<Text tag="h2" type="fluid-heading-05">Fluid heading 05</Text>
<Text tag="h1" type="fluid-heading-06">Fluid heading 06</Text>

### Quotation

Set in IBM Plex Serif.

<Text tag="blockquote" type="fluid-quotation-01">Quotation 01</Text>
<Text tag="blockquote" type="fluid-quotation-02">Quotation 02</Text>

### Display

The largest fluid sizes, for hero moments.

<Text tag="h1" type="fluid-display-01">Display 01</Text>
<Text tag="h1" type="fluid-display-02">Display 02</Text>
<Text tag="h1" type="fluid-display-03">Display 03</Text>
<Text tag="h1" type="fluid-display-04">Display 04</Text>

## Custom element

Set `tag` to render a different element. Type and color apply to whichever tag you choose.

<Text tag="em" type="body-compact-01">Inline emphasis</Text>
<Text tag="blockquote" type="fluid-quotation-01">A quotation rendered as a blockquote.</Text>

## Modifiers

Set modifier props alongside a type style.

### Weight, style, and family

<Stack gap={5}>
  <Text type="body-01" weight="light">Light weight (300)</Text>
  <Text type="body-01" weight="regular">Regular weight (400)</Text>
  <Text type="body-01" weight="semibold">Semibold weight (600)</Text>
  <Text type="body-01" italic>Italic body text</Text>
  <Text type="body-01" family="mono">IBM Plex Mono</Text>
  <Text type="body-01" family="serif">IBM Plex Serif</Text>
  <Text type="body-01" family="sans-condensed">IBM Plex Sans Condensed</Text>
  <Text type="body-01" family="sans-hebrew">IBM Plex Sans Hebrew</Text>
</Stack>

### Wrapping

Set `wrap` to `break-word` to break long words, or `nowrap` to keep text on one line.

<Box maxWidth="12rem" border="subtle" padding={3}>
  <Text type="body-compact-01" wrap="break-word">supercalifragilisticexpialidocious@example.com</Text>
</Box>

<Box maxWidth="12rem" border="subtle" padding={3}>
  <Text type="body-compact-01" wrap="nowrap">This line will not wrap to the next row.</Text>
</Box>

Set `balance` to even out line lengths across a wrapped heading.

<Text tag="h2" type="heading-04" balance maxWidth="20rem">Balanced heading across multiple lines</Text>

### Pretty formatting

Set `pretty` to avoid a single orphaned word on the last line of a wrapped paragraph. Unlike `balance`, which evens out line lengths and suits short headings, `pretty` only adjusts the last line and works well for longer body copy.

<Stack orientation="horizontal" gap={6}>
  <Stack gap={2}>
    <Text type="label-01" color="secondary">Without pretty</Text>
    <Box maxWidth="13rem" border="subtle" padding={3}>
      <Text type="body-01">
        Carbon Components Svelte is a Svelte component library that implements the Carbon Design System, an open source design system by IBM.
      </Text>
    </Box>
  </Stack>
  <Stack gap={2}>
    <Text type="label-01" color="secondary">With pretty</Text>
    <Box maxWidth="13rem" border="subtle" padding={3}>
      <Text type="body-01" pretty>
        Carbon Components Svelte is a Svelte component library that implements the Carbon Design System, an open source design system by IBM.
      </Text>
    </Box>
  </Stack>
</Stack>

### Max width and full width

Set `maxWidth` to any CSS length. Numbers are treated as pixels; strings accept units such as ch, rem, %, or px. Text fills its container by default. Width caps are opt-in — neither maxWidth nor fullWidth applies unless you set one.

<Stack gap={5}>
  <Text type="body-01" maxWidth="38ch">
    Character measure (`38ch`) scales with the font size and is useful for readable line length.
  </Text>
  <Text type="body-01" maxWidth="20rem">
    Rem-based width (`20rem`) tracks the root font size.
  </Text>
  <Text type="body-01" maxWidth={480}>
    Pixel width (`480`) when you need a fixed cap.
  </Text>
</Stack>

Set `fullWidth` when the row should span its container (`width: 100%`). A block element already spans its parent; use it in flex or grid layouts where width must be explicit. Pair with maxWidth when the row is full width but the copy should stay capped. Use [Box](/components/Box) for the bordered container:

<Box border="subtle" padding={5} fullWidth>
  <Text type="body-01" fullWidth maxWidth="38ch">
    This paragraph fills the container row but stops at 38ch.
  </Text>
</Box>

<Box border="subtle" padding={5} fullWidth>
  <Text type="body-01" fullWidth>
    Without `maxWidth`, `fullWidth` stretches across the entire container.
  </Text>
</Box>

## Truncate

Set `lines` to truncate overflow while keeping the Carbon type style. See also [Truncate](/components/Truncate) for wrapping inline text, or the truncate action on native elements.

### Single line

Set `lines` to `1` to truncate a single line with an ellipsis. Pair with `maxWidth` (or a constrained container) so there is a boundary to truncate against.

<Text type="body-compact-01" maxWidth="16rem" lines={1}>
  Carbon Components Svelte is a Svelte component library that implements the Carbon Design System.
</Text>

Set `clamp` to `"front"` to truncate from the start instead of the end. `clamp` only takes effect when `lines` is `1`; multiline mode always clamps at the end.

<Text type="body-compact-01" maxWidth="16rem" lines={1} clamp="front">
  Carbon Components Svelte is a Svelte component library that implements the Carbon Design System.
</Text>

### Multiline

Values of `lines` above `1` use multiline mode (end clamp only).

<Text type="body-01" maxWidth="20rem" lines={3}>
  Carbon Components Svelte is a Svelte component library that implements the Carbon Design System, an open source design system by IBM. It is maintained by the open source community and is available on npm.
</Text>

Alternatively, wrap inline Text with the Truncate component:

<Box maxWidth="20rem">
  <Truncate lines={3}>
    <Text tag="span" type="body-02">
      Carbon Components Svelte is a Svelte component library that implements the Carbon Design System, an open source design system by IBM. It is maintained by the open source community and is available on npm.
    </Text>
  </Truncate>
</Box>

## Typography inspiration

Combine type, color, and element choice as you would on an IBM product page: expressive type for editorial moments, productive type for application UI.

<Stack gap={8}>
  <Text type="label-02" color="secondary">IBM Cloud · Observability</Text>
  <Text tag="h1" type="fluid-display-03" color="primary" balance>See what your systems are telling you</Text>
  <Text type="fluid-paragraph-01" color="primary" maxWidth="44ch">Before an incident reaches your customers, traces and logs already carry the signal. IBM Cloud Observability brings metrics, logs, and traces into one workspace so your team can investigate faster and ship with confidence.</Text>
  <Stack gap={5}>
    <Text tag="h2" type="heading-05" color="primary">Unified telemetry across hybrid cloud</Text>
    <Text type="body-02" color="primary" maxWidth="52ch">Connect Kubernetes clusters on Red Hat OpenShift, virtual servers, and managed services without reconfiguring your instrumentation. Retention policies and access controls follow the governance model your organization already uses in IBM Cloud.</Text>
  </Stack>
  <Text tag="blockquote" type="fluid-quotation-01" color="primary" maxWidth="24ch">Good typography earns trust by staying out of the way while you make decisions that matter.</Text>
  <Stack gap={2}>
    <Text tag="h4" type="heading-02" color="primary">Active incidents</Text>
    <Text type="body-compact-01" color="secondary">3 open · Last updated 2 minutes ago</Text>
    <Text type="label-01" color="placeholder">Metrics retained for 30 days on the Standard plan.</Text>
  </Stack>
  <Box display="flex" direction="column" gap={6} fill="layer-01" padding={6} border="subtle" maxWidth="42rem">
    <Text tag="h3" type="heading-03" color="primary">Create an ingestion endpoint</Text>
    <Text type="body-01" color="secondary" maxWidth="42ch">API keys authenticate programmatic access to your observability workspace. Store secrets in IBM Cloud Secrets Manager and rotate them on a schedule your security team defines.</Text>
    <Stack gap={1}>
      <Text type="label-01" color="primary">Service name</Text>
      <Text type="helper-text-01" color="helper">Use lowercase letters, numbers, and hyphens.</Text>
    </Stack>
  </Box>
</Stack>

## Utility classes

Apply Carbon type utilities directly when you do not need the component. Classes use the `bx--` prefix.

| Class | Description |
| ----- | ----------- |
| `bx--type-{token}` | Carbon type style. See [Type styles](#type-styles) for tokens |
| `bx--type-text-primary` | Primary text color |
| `bx--type-text-secondary` | Secondary text color |
| `bx--type-text-placeholder` | Placeholder text color |
| `bx--type-text-helper` | Helper text color |
| `bx--type-text-on-color` | Text on a colored background |
| `bx--type-text-inverse` | Text on an inverse surface |
| `bx--type-text-error` | Error text color |
| `bx--type-text-disabled` | Disabled text color |
| `bx--type-mono` | IBM Plex Mono |
| `bx--type-sans` | IBM Plex Sans |
| `bx--type-sans-condensed` | IBM Plex Sans Condensed |
| `bx--type-sans-hebrew` | IBM Plex Sans Hebrew |
| `bx--type-serif` | IBM Plex Serif |
| `bx--type-light` | Font weight 300 |
| `bx--type-regular` | Font weight 400 |
| `bx--type-semibold` | Font weight 600 |
| `bx--type-italic` | Italic |
| `bx--type-break-word` | Break long words |
| `bx--type-nowrap` | Keep text on one line |
| `bx--type-balance` | Balance line lengths |
| `bx--type-full-width` | Span the full container width (`width: 100%`) |

<p class="bx--type-heading-02">Styled with bx--type-heading-02</p>
<p class="bx--type-body-01 bx--type-semibold">Semibold body text</p>
<p class="bx--type-body-01 bx--type-nowrap">Kept on one line with bx--type-nowrap</p>
