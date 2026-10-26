<script>
  import "carbon-components-svelte/css/prose.css";
  import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";
  import Layer from "carbon-components-svelte/Layer/Layer.svelte";
  import Link from "carbon-components-svelte/Link/Link.svelte";
  import ListItem from "carbon-components-svelte/ListItem/ListItem.svelte";
  import InlineNotification from "carbon-components-svelte/Notification/InlineNotification.svelte";
  import Prose from "carbon-components-svelte/Prose/Prose.svelte";
  import Text from "carbon-components-svelte/Text/Text.svelte";
  import UnorderedList from "carbon-components-svelte/UnorderedList/UnorderedList.svelte";

  const variant =
    new URLSearchParams(location.search).get("variant") ?? "default";
</script>

<div style="padding: 2rem">
  <Prose {variant} data-testid="prose">
    <h1>Reporting API</h1>
    <p data-testid="raw-p">
      The reporting API returns usage and billing data for every project in your
      organization, so finance and engineering read the same numbers. Send a
      request with <code data-testid="raw-code">Authorization</code>, or read
      the <a href="#setup" data-testid="raw-link">setup guide</a>.
    </p>
    <h2 id="setup">Setup</h2>
    <p>Create a project in the console, then generate an API key.</p>
    <ul data-testid="raw-ul">
      <li>Keys are scoped to <strong>one project</strong>.</li>
      <li>
        Keys can be revoked at any time.
        <ul>
          <li>Revoked keys fail with <code>401</code>.</li>
        </ul>
      </li>
    </ul>
    <h3>Request</h3>
    <pre data-testid="raw-pre"><code
        >curl -H "Authorization: Bearer $KEY" \
  https://api.example.com/v1/usage</code
      ></pre>
    <blockquote>
      <p>
        Choose the region when you create the project. It can't be changed
        later.
      </p>
    </blockquote>
    <table>
      <thead>
        <tr>
          <th>Status</th>
          <th>Meaning</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>200</code></td>
          <td>Success</td>
        </tr>
        <tr>
          <td><code>429</code></td>
          <td>Rate limited; retry after the <kbd>Retry-After</kbd> seconds</td>
        </tr>
      </tbody>
    </table>
    <section>
      <h3>Limits</h3>
      <p data-testid="section-p">Requests are limited to 600 per minute.</p>
    </section>
    <h4>Quotas</h4>
    <h5 data-testid="h5">Per key</h5>
    <h6 data-testid="h6">Bursts</h6>
    <p>Short bursts over the limit are allowed.</p>
    <hr />
    <h2 id="markdown-extras" data-testid="anchored-heading">
      Markdown extras
      <a
        class="bx--prose__heading-anchor"
        href="#markdown-extras"
        aria-label="Link to Markdown extras"
        data-testid="heading-anchor">#</a
      >
    </h2>
    <table>
      <thead>
        <tr>
          <th>Region</th>
          <th align="center" data-testid="th-center">Status</th>
          <th align="right">Requests</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>us-east</td>
          <td align="center">OK</td>
          <td align="right">6,204,118</td>
        </tr>
      </tbody>
    </table>
    <ul class="contains-task-list">
      <li class="task-list-item" data-testid="task-li">
        <label
          ><input type="checkbox" disabled checked />
          Create the project</label
        >
      </li>
      <li class="task-list-item">
        <label><input type="checkbox" disabled /> Generate an API key</label>
      </li>
    </ul>
    <blockquote
      data-alert="note"
      data-alert-title="Note"
      data-testid="alert-note"
    >
      <p>Keys are scoped to one project.</p>
    </blockquote>
    <blockquote data-alert="tip" data-alert-title="Tip">
      <p>Use one key per environment.</p>
    </blockquote>
    <blockquote data-alert="important" data-alert-title="Important">
      <p>Regions can't be changed later.</p>
    </blockquote>
    <blockquote data-alert="warning" data-alert-title="Warning">
      <p>
        Requests over the limit return
        <code data-testid="alert-code">429</code>.
      </p>
      <pre data-testid="alert-pre"><code>Retry-After: 30</code></pre>
    </blockquote>
    <blockquote data-alert="caution" data-alert-title="Caution">
      <p>Revoking a key breaks every client that uses it.</p>
    </blockquote>
    <p data-testid="footnoted">
      Limits apply per key<sup class="footnote-ref"
        ><a href="#fn-1" id="fnref-1" data-testid="footnote-ref">1</a></sup
      >.
    </p>
    <details data-testid="details">
      <summary data-testid="summary">Advanced options</summary>
      <p>Set a custom timeout per request.</p>
    </details>
    <ul>
      <li data-testid="parent-item">
        Parent item
        <ul data-testid="nested-list">
          <li>Child item</li>
        </ul>
      </li>
    </ul>
    <section class="footnotes" data-testid="footnotes">
      <ol>
        <li id="fn-1">
          <p>
            Keys share one limit.
            <a
              href="#fnref-1"
              class="footnote-backref"
              aria-label="Back to reference 1">↩</a
            >
          </p>
        </li>
      </ol>
    </section>
    <h2>Nested Prose</h2>
    <Prose variant="compact" data-testid="nested-prose">
      <p data-testid="nested-p">
        A compact Prose nested in this one sets its own copy.
      </p>
      <ul>
        <li data-testid="nested-li">Its list keeps bullets.</li>
      </ul>
    </Prose>
    <h2>Carbon components inside</h2>
    <InlineNotification lowContrast hideCloseButton kind="info" title="Note">
      <svelte:fragment slot="subtitleChildren">
        Read the <a href="#setup">setup guide</a> <strong>first</strong>.
      </svelte:fragment>
    </InlineNotification>
    <Text>Text keeps body-01.</Text>
    <p>
      Inline snippet:
      <CodeSnippet type="inline" code="npm i carbon-components-svelte" />
    </p>
    <CodeSnippet code="bun add carbon-components-svelte" />
    <p data-testid="after-snippet">
      <Link href="#setup">Carbon Link</Link>
      keeps its style.
    </p>
    <UnorderedList>
      <ListItem>Carbon list item</ListItem>
    </UnorderedList>
  </Prose>
  <Prose linkTone="muted" data-testid="muted-prose">
    <h2 id="muted-heading">
      Muted links
      <a
        class="bx--prose__heading-anchor"
        href="#muted-heading"
        aria-label="Link to Muted links"
        data-testid="muted-anchor">#</a
      >
    </h2>
    <p>Read the <a href="#setup" data-testid="muted-link">setup guide</a>.</p>
    <Prose>
      <p>
        A default Prose inside keeps its
        <a href="#setup" data-testid="nested-default-link">link color</a>.
      </p>
    </Prose>
  </Prose>
  <Prose tableWidth="full" data-testid="full-table-prose">
    <table data-testid="full-table">
      <thead>
        <tr>
          <th data-testid="full-first">Region</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>eu-west</td>
          <td>OK</td>
        </tr>
      </tbody>
    </table>
  </Prose>
  <Prose data-testid="blocks">
    <h2>Text color</h2>
    <h3 data-testid="stacked-heading">Semantic tokens</h3>
    <p>Copy before a table.</p>
    <table data-testid="block-table">
      <thead>
        <tr>
          <th>Token</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>primary</td>
        </tr>
      </tbody>
    </table>
    <p data-testid="after-table">Copy after a table.</p>
    <figure data-testid="block-figure">
      <pre><code>npm i carbon-components-svelte</code></pre>
    </figure>
    <h3>Usage</h3>
    <table data-testid="table-after-heading">
      <thead>
        <tr>
          <th>Prop</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>color</td>
        </tr>
      </tbody>
    </table>
  </Prose>
  <Prose data-testid="gaps">
    <p data-testid="before-nested">Copy before a nested Prose.</p>
    <Prose variant="compact" data-testid="nested-gaps">
      <p>A compact note.</p>
    </Prose>
    <p data-testid="after-nested">Copy after it.</p>
    <Text tag="span">Inline Text</Text>
    <p data-testid="after-inline">Copy after inline Text.</p>
    <Text>Text in its default tag</Text>
    <p data-testid="after-text">Copy after Text.</p>
    <Text tag="div">Text in a div</Text>
    <p data-testid="after-text-div">Copy after it.</p>
  </Prose>
  <Prose dividers>
    <h2 data-testid="first-divided">Install</h2>
    <p>Add the package.</p>
    <h2 data-testid="second-divided">Configure</h2>
    <p>Import the styles.</p>
  </Prose>
  <div class="bx--prose-flow" data-testid="flow">
    <Prose><p>Copy that sets up the example below.</p></Prose>
    <CodeSnippet code="npm i carbon-components-svelte" />
    <Prose data-testid="flow-after-component">
      <p>Copy that follows the example.</p>
    </Prose>
    <Prose data-testid="flow-heading">
      <h2>Next section</h2>
      <p>A run that opens with a heading.</p>
    </Prose>
  </div>
  <Prose data-testid="page-prose">
    <pre data-testid="page-pre"><code>npm i carbon-components-svelte</code
      ></pre>
  </Prose>
  <Layer>
    <Prose>
      <p>Code on a layer: <code data-testid="layer-code">value</code></p>
      <pre data-testid="layer-pre"><code>npm i carbon-components-svelte</code
        ></pre>
      <blockquote
        data-alert="note"
        data-alert-title="Note"
        data-testid="layer-alert"
      >
        <pre data-testid="layer-alert-pre"><code>Retry-After: 30</code></pre>
      </blockquote>
    </Prose>
  </Layer>
  <div dir="rtl">
    <Prose>
      <ul data-testid="rtl-ul">
        <li>عنصر</li>
      </ul>
      <blockquote data-testid="rtl-quote"><p>اقتباس</p></blockquote>
      <pre data-testid="rtl-pre"><code>npm i carbon-components-svelte</code
        ></pre>
      <table>
        <tbody>
          <tr>
            <td data-testid="rtl-first">أ</td>
            <td>ب</td>
          </tr>
        </tbody>
      </table>
    </Prose>
  </div>
  <!-- Pushes the deferred block below the viewport. -->
  <div style="height: 150vh"></div>
  <Prose deferOffscreen>
    <pre data-testid="deferred-pre"><code>npm i carbon-components-svelte</code
      ></pre>
    <table data-testid="deferred-table">
      <tbody>
        <tr>
          <td>eu-west</td>
        </tr>
      </tbody>
    </table>
  </Prose>
  <div data-testid="outside">
    <InlineNotification lowContrast hideCloseButton kind="info" title="Note">
      <svelte:fragment slot="subtitleChildren">
        Read the <a href="#setup">setup guide</a> <strong>first</strong>.
      </svelte:fragment>
    </InlineNotification>
    <Text>Text keeps body-01.</Text>
    <p><CodeSnippet type="inline" code="npm i carbon-components-svelte" /></p>
    <CodeSnippet code="bun add carbon-components-svelte" />
    <Link href="#setup">Carbon Link</Link>
    <UnorderedList><ListItem>Carbon list item</ListItem></UnorderedList>
  </div>
</div>
