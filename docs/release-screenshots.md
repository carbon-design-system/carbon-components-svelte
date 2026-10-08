# Release screenshots

Recipe for turning the `<!-- screenshot: ... -->` and `<!-- video: ... -->` markers in a GitHub release body into 4x PNGs. It was first run for [v0.113.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.113.0). Run it as part of the [post-release checklist](../CONTRIBUTING.md#post-release-checklist).

Each marker follows a fenced `svelte` snippet. The goal is for the image to be what that snippet renders, so every snippet is compiled verbatim, bundled with the repo's own `src/` and `css/all.css`, and captured in your installed Chrome. It is a Bun script with no dependencies beyond what the repo already has: no Playwright, no Vite, and nothing written into `e2e/`. All 15 v0.113.0 shots take about 3.5 seconds cold and well under a second when cached.

This is for running locally. It needs Chrome (or Chromium) installed, and Bun 1.4 or newer for `Bun.WebView`.

## Prerequisites

- `css/all.css` exists. It is gitignored and built by `bun setup`; rebuild it with `bun run build:css` if your checkout is stale.
- Chrome is installed. Bun finds it automatically; set `BUN_CHROME_PATH` to use another binary.
- `gh` is authenticated, if you pass a tag. (A saved Markdown file works without it.)

## Steps

1. **Add a recipe for each new marker** in [`scripts/lib/release-screenshot-recipes.ts`](../scripts/lib/release-screenshot-recipes.ts) (see [Recipes](#recipes)). A snippet with no recipe is captured as mounted at 420px wide, which is right for static components.

2. **Run it.** Pass the release tag and the script fetches the notes with `gh`, or pass a saved Markdown file.

   ```sh
   bun run release:screenshots vX.Y.Z                 # all
   bun run release:screenshots vX.Y.Z meter box       # some
   bun run release:screenshots notes.md --scale 2 --out /tmp/shots --jobs 2
   ```

   Output goes to the gitignored `release-screenshots/<name>.png`. `--jobs` sets how many Chrome views capture at once (default 4, or fewer on a smaller machine). Unchanged shots are reused from a cache (see [Caching](#caching)); `--no-cache` forces a fresh render. A `SKIP` line means no `svelte` fence precedes that marker. Keep the markers in the body while drafting; strip them from the published notes when you replace them with images.

3. **Check the output.** Compare each image against the marker's description, not just "it rendered". Previews of 4x images can exceed viewer size limits; downscale a copy to look, never the original: `sips -Z 900 in.png --out /tmp/in.png`.

4. **Attach the images** by dragging the PNGs into the GitHub release editor, then delete the marker comments. Do not commit them.

## How it works

1. `extractSnippets` pairs each marker with its preceding `svelte` fence. The fences are written to `node_modules/.cache/release-screenshots/<name>.svelte`, under the repo so `svelte` resolves. GitHub returns CRLF line endings; they are normalized first (every fence regex fails otherwise).
2. One `Bun.build` bundles all snippets as lazy modules chosen by `?s=<name>`. A small plugin compiles `.svelte` files with `svelte/compiler` and aliases `carbon-components-svelte` to `src/` and its `css/` path to `css/`.
3. `Bun.serve` serves the bundle from memory on a free port.
4. Chrome and its views start while the bundle builds. Each view (`--jobs` of them, in one Chrome) pulls shot names off a shared queue, so shots run side by side. A single view allows one CDP call at a time, which is why parallelism comes from views, not from overlapping calls on one. For each shot, a view sets the viewport and `deviceScaleFactor` through `Emulation.setDeviceMetricsOverride`, loads the page, waits for fonts and running animations, runs the recipe, then crops `Page.captureScreenshot` to the `#app` box.

The browser is always spawned fresh (`url: false`). Without that, Bun attaches to a Chrome you already have open with remote debugging, and macOS prompts you to allow it.

## Caching

Each shot is cached under `node_modules/.cache/release-screenshots/png`, keyed on a hash of its snippet, recipe (options and `act` source), `--scale`, the library (`src/` and `css/all.css`), and the capture scripts themselves. Edit one recipe and only that shot re-renders. If every shot is cached, Chrome never starts (about 0.2s). Change anything in `src/`, rebuild the CSS, or edit the scripts and everything re-renders.

Set `volatile: true` on a recipe whose output depends on the clock, like `relative-time`, so it is always re-rendered.

## Recipes

Set per-shot options in `recipes`:

| Option | Use |
| --- | --- |
| `width` | `#app` width in CSS px (default 420). Wider for tables and page headers. |
| `viewport` | Capture the whole viewport instead of `#app`. For fixed-position overlays such as `GridOverlay`; also zeroes `#app` padding. |
| `volatile` | Never cache this shot. |
| `act(view)` | Interaction to run before capture. |

Helpers for `act`, from [`scripts/lib/release-screenshots.ts`](../scripts/lib/release-screenshots.ts):

| Helper | Does |
| --- | --- |
| `css(v, text)` | Inject a stylesheet. Use it to reserve room for popups (`#app{min-height:...}`). |
| `tag(v, selector, regex, nth)` | Find an element by text, `aria-label`, or `title`, and return a selector `v.click` can use. |
| `quiet(v, blur)` | Move the mouse away, and blur the active element unless `blur` is `false`. |
| `settle(v)` | Wait for fonts, running animations, and two frames. Runs before and after every `act` already. |
| `waitFor(v, selector)` | Resolve once the selector matches. |
| `v.click(selector, { modifiers })` | Real click with an actionability wait. |
| `v.cdp(method, params)` | Any CDP command, for hover and anything else `WebView` lacks. |

Patterns that came up:

| Marker says | Do |
| --- | --- |
| Pressed or selected state | `v.click(await tag(...))`, then `quiet(v)`. |
| Menu or popover open | Click the trigger, `css` a `min-height` on `#app`, then `quiet(v, false)` to keep the focused menu item. |
| Video: "move to the next slide" and similar | Capture the end state of the described interaction. Screenshots stand in for videos. |
| Virtualized list | Find the scroller (`scrollHeight > clientHeight`) and set `scrollTop` to `itemHeight * row`. |
| flatpickr | Click the input, wait for `.flatpickr-calendar.open`, then `tag` the day cells (exclude `.prevMonthDay` and `.nextMonthDay`). Pass `modifiers: ["Shift"]` for shift-click. A `min-height` of about 470. |
| Tooltip on hover | See the gotcha below. |
| Several sibling components | Mount as written. If they stack too tightly, lay them out in a row with `css` and say so in the PR. |

## Gotchas

- **4x, PNG, no downscaling.** `deviceScaleFactor: 4` renders text and edges natively at 4x; it is not an upscale. The files are small (7 to 90 KB) because the content is flat color and text.
- **`WebView` has no element screenshot or scale option.** [`release-screenshots.ts`](../scripts/release-screenshots.ts) does both over CDP. Round the clip height up (`Math.ceil`), or Chrome crops a CSS pixel and the image no longer matches an element-screenshot render.
- **`cdp()` needs a session.** `navigate("about:blank")` once before the first `cdp` call. Each view also allows one `cdp` or `evaluate` call in flight, so do not `Promise.all` them.
- **Wait on animations, not timers.** `settle` awaits `document.getAnimations()`, so menus and calendars are captured after their open animation, with no fixed sleeps.
- **Focus rings and hover.** A click leaves the clicked element focused, and the mouse stays over it. Call `quiet` before capture unless the marker asks for focus. Menus are the exception: keep the focus ring on the first item, which is what the component does when opened.
- **Native `title` tooltips are not rendered headlessly.** `RelativeTime` uses `title`. Draw an equivalent element from the real `title` value (see the recipe) and say in the PR that it is simulated.
- **Capped menus.** `MultiSelect`'s menu stops at about 5.5 rows, so a marker that names every group header needs `max-height: none` on `.bx--list-box--expanded .bx--list-box__menu`. This changes the default rendering. Disclose it.
- **Element screenshots clip popups.** Reserve space with `min-height` on `#app`; the clip is the `#app` box.
- **Do not change the markup to look better.** Layout-only CSS on `#app` (width, flex row) is fine. Anything that edits the snippet or the component defeats the point; flag every deviation when you hand the images over.
- **Svelte 5 compiles these snippets in legacy mode**, so `let:`, `slot=`, `<svelte:fragment slot>`, and `export let` all work as written in release notes.
- **Use a fixed viewport width** (`width + 64`) so wrapping is reproducible. `GridOverlay` is `pointer-events: none` and sized to the viewport, so capture it at a real breakpoint width (1056 is `lg`).
- **Timestamps differ between runs.** `RelativeTime`'s tooltip shows the current time minus five minutes. That is the only expected diff when re-running a release.
