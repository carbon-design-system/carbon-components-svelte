---
title: Fonts
layout: guide
description: Load IBM Plex from IBM's CDN or your own server, or use another font, with Carbon Components Svelte.
---

## How fonts load

The theme stylesheets (`all.css`, `white.css` and the others) load IBM Plex Sans, Mono and Serif from IBM's CDN. A browser only downloads a face that text on the page uses, so an app that never shows serif text never loads Plex Serif.

The faces use `font-display: swap`. Text shows in Helvetica Neue or Arial first, then switches to Plex once it loads.

## Pick a setup

The components read their families from three [font variables](#font-variables). Point them at another family, and the browser stops downloading Plex from IBM's CDN.

| You want | Do this |
| :--- | :--- |
| IBM Plex from IBM's CDN | Nothing. The theme stylesheet loads it. |
| IBM Plex from your own server or another CDN | Load it under a family name of your own, and set the variables. See [Self-host IBM Plex](#self-host-ibm-plex). |
| Another font | Load its `@font-face` rules, and set the variables. |
| No web fonts | Set the variables to system fonts. |

## Self-host IBM Plex

Self-host when your app can't reach IBM's CDN, such as an intranet, or when the fonts must load from your own domain. Serve the Plex files from your app, for example from the `@ibm/plex-sans` and `@ibm/plex-mono` packages, under a family name of your own, and point the variables at it:

```css
@font-face {
  font-family: "Plex Local";
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/IBMPlexSans-Regular.woff2") format("woff2");
}
/* One rule per weight the components use: 300, 400 and 600. The same for Mono. */

:root {
  --ccs-font-sans: "Plex Local", "Helvetica Neue", Arial, sans-serif;
  --ccs-font-mono: "Plex Mono Local", Menlo, monospace;
}
```

Use a name of your own, not "IBM Plex Sans". The theme stylesheet declares that name with IBM's CDN, so the browser would fetch the faces from both places. The same goes for Plex from another CDN: declare its URLs under your own name.

## Font variables

Three CSS variables set the families. Each one defaults to the IBM Plex stack.

| Variable | Used by | Default |
| :--- | :--- | :--- |
| `--ccs-font-sans` | Body text and every component | `"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif` |
| `--ccs-font-mono` | `code`, `CodeSnippet`, and the `code-01` and `code-02` type styles | `"IBM Plex Mono", Menlo, "DejaVu Sans Mono", "Bitstream Vera Sans Mono", Courier, monospace` |
| `--ccs-font-serif` | The `fluid-quotation-01`, `fluid-quotation-02` and `serif` type styles | `"IBM Plex Serif", Georgia, Times, serif` |

Set them on `:root`:

```css
:root {
  --ccs-font-sans: "Inter", "Helvetica Neue", Arial, sans-serif;
  --ccs-font-mono: "JetBrains Mono", Menlo, monospace;
}
```

Load the font's own `@font-face` rules too, from its package or service. Without them, the browser falls back to the next family in the list.

To use system fonts and load nothing:

```css
:root {
  --ccs-font-sans: system-ui, sans-serif;
  --ccs-font-mono: ui-monospace, monospace;
  --ccs-font-serif: ui-serif, serif;
}
```

### Part of a page

Text inherits its family from `body`. To change the font in one part of a page, set the variable and `font-family` on that element:

```css
.marketing {
  --ccs-font-sans: "Inter", sans-serif;
  font-family: var(--ccs-font-sans);
}
```

In a [ThemeZone](/components/ThemeZone), the `code-01` and `code-02` type styles follow `--ccs-font-mono` on their own.

## Other scripts

IBM Plex has families for other scripts, such as IBM Plex Sans Arabic and IBM Plex Sans Hebrew. Install the package, import its CSS, and list the family first in `--ccs-font-sans`. The browser uses it for the characters it covers and IBM Plex Sans for the rest.

```sh
npm install @ibm/plex-sans-arabic
```

```js
import "@ibm/plex-sans-arabic/css/ibm-plex-sans-arabic-default.min.css";
```

```css
:root {
  --ccs-font-sans: "IBM Plex Sans Arabic", "IBM Plex Sans", "Helvetica Neue",
    Arial, sans-serif;
}
```

For a right-to-left layout, see [Right-to-left](/right-to-left).

## Server rendering

With server rendering, text shows in the fallback font until Plex loads. To load the main face sooner, preload it in `src/app.html`:

```html
<link
  rel="preload"
  href="https://1.www.s81c.com/common/carbon/plex/fonts/IBM-Plex-Sans/fonts/complete/woff2/IBMPlexSans-Regular.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```

Preload only the faces above the fold, such as regular and semibold sans. Each preload competes with other requests. When you self-host, preload the files your bundler emits instead. See [Server-side rendering](/server-rendering).
