<script lang="ts">
  import { Column, Content, Grid, Link, Row } from "carbon-components-svelte";
  import DocHero from "../components/DocHero.svelte";
  import DocSection from "../components/DocSection.svelte";
  import DocSectionHeader from "../components/DocSectionHeader.svelte";
</script>

<svelte:head>
  <title>Performance · Carbon Components Svelte</title>
  <meta
    name="description"
    content="When to virtualize large lists and tables, how to defer costly widgets, and how to measure rendering cost."
  >
</svelte:head>

<Content class="performance-page">
  <DocHero
    eyebrow="Guides"
    title="Performance"
    description="Most components mount in well under a millisecond. What slows a page down is volume: a table that renders every row, dozens of live widgets mounted at load, or content laid out long before anyone scrolls to it."
  />

  <DocSection>
    <Grid>
      <DocSectionHeader
        eyebrow="Large data"
        title="Render only the rows in view"
        description="Every rendered row costs time to mount, sort, and filter. The list components window their menus on their own; tables and trees leave it to you, because windowing changes their layout."
      />
      <Row>
        <Column lg={12}>
          <div class="prose">
            <table>
              <thead>
                <tr>
                  <th class="bx--type-label-01">Component</th>
                  <th class="bx--type-label-01">Default</th>
                  <th class="bx--type-label-01">When to change it</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    <Link href="/components/ComboBox#virtualization"
                      >ComboBox</Link
                    >,
                    <Link href="/components/Dropdown#virtualization"
                      >Dropdown</Link
                    >,
                    <Link href="/components/MultiSelect#virtualization"
                      >MultiSelect</Link
                    >
                  </td>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    Virtualize past 100 items
                  </td>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    Leave it on. A ComboBox with 5,000 items and
                    <code class="bx--type-code-01">virtualize={"{false}"}</code>
                    takes several hundred milliseconds to open.
                  </td>
                </tr>
                <tr>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    <Link href="/components/DataTable#when-to-virtualize"
                      >DataTable</Link
                    >
                  </td>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    Renders every row
                  </td>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    Set <code class="bx--type-code-01">virtualize</code> or
                    <code class="bx--type-code-01">pageSize</code>
                    past a few hundred rows. Sorting 1,000 rows takes about 30
                    ms with every row rendered, under 2 ms virtualized.
                  </td>
                </tr>
                <tr>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    <Link href="/components/DataTable#debounced"
                      >ToolbarSearch</Link
                    >
                  </td>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    Filters on every keystroke
                  </td>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    Set <code class="bx--type-code-01">debounce</code> to filter
                    once typing pauses, or
                    <code class="bx--type-code-01">deferFilter</code>
                    to paint the input before the rows re-render. Clearing a
                    1,000-row search drops from about 120 ms to under 16 ms.
                  </td>
                </tr>
                <tr>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    <Link href="/components/TreeView#performance"
                      >TreeView</Link
                    >
                  </td>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    Mounts a collapsed subtree on its first expand
                  </td>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    Set <code class="bx--type-code-01">virtualize</code> for
                    nodes with thousands of children.
                  </td>
                </tr>
                <tr>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    <Link href="/components/VirtualList">VirtualList</Link>
                  </td>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    Windows every list
                  </td>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    Set <code class="bx--type-code-01">threshold</code> to
                    render short lists in full, which keeps their rows in find
                    in page.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Column>
      </Row>
    </Grid>
  </DocSection>

  <DocSection>
    <Grid>
      <DocSectionHeader
        eyebrow="Deferring work"
        title="Mount what the reader can see"
        description="A long page can hold dozens of live widgets. Defer the costly ones until they near the viewport, and let the browser skip rendering static content offscreen."
      />
      <Row>
        <Column lg={12}>
          <div class="prose">
            <table>
              <thead>
                <tr>
                  <th class="bx--type-label-01">Technique</th>
                  <th class="bx--type-label-01">
                    Keeps find in page and the accessibility tree
                  </th>
                  <th class="bx--type-label-01">Use it for</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    <Link href="/components/LazyMount">LazyMount</Link>
                  </td>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    No, until it mounts
                  </td>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    Live examples, charts, large tables, and other widgets that
                    are costly to mount
                  </td>
                </tr>
                <tr>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    CSS
                    <code class="bx--type-code-01"
                      >content-visibility: auto</code
                    >
                  </td>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    Yes
                  </td>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    Code blocks and figures that are costly to lay out. Pair it
                    with
                    <code class="bx--type-code-01">contain-intrinsic-size</code>
                    so the scrollbar stays steady. Avoid it on content that
                    overflows its box, such as tables, since paint containment
                    clips it.
                  </td>
                </tr>
                <tr>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    <Link href="/components/ImageLoader#lazy-loading"
                      >ImageLoader</Link
                    >
                    <code class="bx--type-code-01">lazy</code>
                  </td>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    Yes
                  </td>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    Images below the fold. Loading starts once the image is
                    within <code class="bx--type-code-01">rootMargin</code> of
                    the viewport.
                  </td>
                </tr>
                <tr>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    Native <code class="bx--type-code-01">loading="lazy"</code>
                  </td>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    Yes
                  </td>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    Plain images below the fold. Set
                    <code class="bx--type-code-01">width</code>
                    and
                    <code class="bx--type-code-01">height</code>
                    so the page doesn't shift when they load.
                  </td>
                </tr>
              </tbody>
            </table>
            <table>
              <thead>
                <tr>
                  <th class="bx--type-label-01">Do</th>
                  <th class="bx--type-label-01">Why</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    Leave text, headings, and links out of LazyMount.
                  </td>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    Text is cheap to lay out, and content that hasn't mounted
                    isn't in find in page, anchor links, or server-rendered
                    HTML.
                  </td>
                </tr>
                <tr>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    Force layout before scrolling into a block that
                    <code class="bx--type-code-01">content-visibility</code>
                    skips.
                  </td>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    <code class="bx--type-code-01">scrollIntoView</code>
                    on a skipped block can do nothing. Read
                    <code class="bx--type-code-01"
                      >getBoundingClientRect()</code
                    >
                    first.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Column>
      </Row>
    </Grid>
  </DocSection>

  <DocSection>
    <Grid>
      <DocSectionHeader
        eyebrow="Measuring"
        title="Time a production build"
        description="Numbers from a development build or a jsdom test say little about what users feel."
      />
      <Row>
        <Column lg={12}>
          <div class="prose">
            <table>
              <thead>
                <tr>
                  <th class="bx--type-label-01">Do</th>
                  <th class="bx--type-label-01">Why</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    Measure in a production build.
                  </td>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    Svelte's development mode captures a stack trace on every
                    state change, which inflates timings 5 to 10 times.
                  </td>
                </tr>
                <tr>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    Measure interactions from input to the next paint, with the
                    Event Timing API or the browser's Performance panel.
                  </td>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    That's the delay people feel. Past about 50 ms, an
                    interaction visibly hitches.
                  </td>
                </tr>
                <tr>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    Register
                    <code class="bx--type-code-01">StaticRange</code>
                    objects, not live ranges, with the CSS Custom Highlight API.
                  </td>
                  <td class="bx--type-caption-01 bx--type-text-secondary">
                    The browser updates every live
                    <code class="bx--type-code-01">Range</code>
                    on each DOM change. With 2,000 of them on a page, sorting a
                    1,000-row table took 3 times as long.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Column>
      </Row>
    </Grid>
  </DocSection>
</Content>
