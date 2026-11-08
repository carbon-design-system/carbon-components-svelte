---
title: Fonts
layout: guide
description: Load IBM Plex from IBM's CDN or your own server, or use another font, with Carbon Components Svelte.
---

## How fonts load

The theme stylesheets (`all.css`, `white.css` and the others) style the components but load no fonts. `fonts.css` loads IBM Plex Sans, Mono and Serif from IBM's CDN. Import it after the theme stylesheet:

```js
import "carbon-components-svelte/css/white.css";
import "carbon-components-svelte/css/fonts.css";
```

The faces use `font-display: swap`. Text shows in Helvetica Neue or Arial first, then switches to Plex once it loads. A browser only downloads a face that text on the page uses.

## Pick a setup

| You want | Do this |
| :--- | :--- |
| IBM Plex from IBM's CDN | Import `fonts.css`. |
| IBM Plex from your own server | Skip `fonts.css`, and import the Plex packages' CSS. See [Self-host IBM Plex](#self-host-ibm-plex). |
| IBM Plex from another URL | Copy `fonts.css` into your app and replace its base URL. |
| Another font | Load its `@font-face` rules, and set the [font variables](#font-variables). |
| No web fonts | Skip `fonts.css`. Text uses the fallback stack, or set the variables to `system-ui`. |

## Self-host IBM Plex

Self-host when your app can't reach IBM's CDN, such as an intranet, or when the fonts must load from your own domain. Install the Plex packages:

```sh
npm install @ibm/plex-sans @ibm/plex-mono
```

Import their CSS in place of `fonts.css`:

```js
import "carbon-components-svelte/css/white.css";
import "@ibm/plex-sans/css/ibm-plex-sans-default.min.css";
import "@ibm/plex-mono/css/ibm-plex-mono-default.min.css";
```

The CSS points at the font files with relative URLs, so Vite, webpack and Rollup copy the files into your build. The "default" files hold the weights the components use: 300, 400 and 600. The "all" files add italics and the other weights.

The family names are the same as in `fonts.css` ("IBM Plex Sans", "IBM Plex Mono"), so you don't need to set any variable.

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

## Upgrading from 0.114

Before 0.115.0, every theme stylesheet held the IBM Plex `@font-face` rules. An app that imports only a theme stylesheet now gets Helvetica Neue or Arial. To keep IBM Plex, import `fonts.css` after the theme stylesheet:

```diff
  import "carbon-components-svelte/css/all.css";
+ import "carbon-components-svelte/css/fonts.css";
```
