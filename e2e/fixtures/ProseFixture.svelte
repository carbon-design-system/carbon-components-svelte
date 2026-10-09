<script>
  import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";
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
    <pre data-testid="raw-pre"><code>curl -H "Authorization: Bearer $KEY" \
  https://api.example.com/v1/usage</code></pre>
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
    <hr>
    <h2 id="markdown-extras" data-testid="anchored-heading">
      Markdown extras
      <a
        class="bx--prose__heading-anchor"
        href="#markdown-extras"
        aria-label="Link to Markdown extras"
        data-testid="heading-anchor"
        >#</a
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
          ><input type="checkbox" disabled checked>
          Create the project</label
        >
      </li>
      <li class="task-list-item">
        <label><input type="checkbox" disabled> Generate an API key</label>
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
      <p>Requests over the limit return <code>429</code>.</p>
    </blockquote>
    <blockquote data-alert="caution" data-alert-title="Caution">
      <p>Revoking a key breaks every client that uses it.</p>
    </blockquote>
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
    <Text>Text keeps body-long-01.</Text>
    <p>
      Inline snippet:
      <CodeSnippet type="inline" code="npm i carbon-components-svelte" />
    </p>
    <CodeSnippet code="bun add carbon-components-svelte" />
    <p><Link href="#setup">Carbon Link</Link> keeps its style.</p>
    <UnorderedList>
      <ListItem>Carbon list item</ListItem>
    </UnorderedList>
  </Prose>
  <div data-testid="outside">
    <InlineNotification lowContrast hideCloseButton kind="info" title="Note">
      <svelte:fragment slot="subtitleChildren">
        Read the <a href="#setup">setup guide</a> <strong>first</strong>.
      </svelte:fragment>
    </InlineNotification>
    <Text>Text keeps body-long-01.</Text>
    <p><CodeSnippet type="inline" code="npm i carbon-components-svelte" /></p>
    <CodeSnippet code="bun add carbon-components-svelte" />
    <Link href="#setup">Carbon Link</Link>
    <UnorderedList><ListItem>Carbon list item</ListItem></UnorderedList>
  </div>
</div>
