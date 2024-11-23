<script>
  export let component = {
    props: [],
    slots: [],
    events: [],
    rest_props: undefined,
    typedefs: [],
  };

  import {
    Button,
    OutboundLink,
    Modal,
    StructuredList,
    StructuredListHead,
    StructuredListRow,
    StructuredListCell,
    StructuredListBody,
    UnorderedList,
    ListItem,
    Tag,
  } from "carbon-components-svelte";
  import InlineSnippet from "./InlineSnippet.svelte";
  import PreviewTypeScript from "./PreviewTypeScript.svelte";
  import Code from "carbon-icons-svelte/lib/Code.svelte";
  const mdn_api = "https://developer.mozilla.org/en-US/docs/Web/API/";
  const typeMap = {
    string: "string",
    boolean: "boolean",
    number: "number",
    null: "null",
    Date: "JavaScript Date",
  };

  let full_code = null;
  let full_code_prop = null;

  $: source = `https://github.com/carbon-design-system/carbon-components-svelte/tree/master/${component.filePath}`;
  $: forwarded_events = component.events.filter(
    (event) => event.type === "forwarded",
  );
  $: dispatched_events = component.events.filter(
    (event) => event.type === "dispatched",
  );
</script>

<p style="margin-bottom: var(--cds-layout-02)">
  Source code:
  <OutboundLink size="lg" inline href={source}>
    {component.filePath}
  </OutboundLink>
</p>

<h2 id="props">Props</h2>

{#if component.props.length > 0}
  <div class="overflow">
    <StructuredList flush condensed>
      <StructuredListHead>
        <StructuredListRow head>
          <StructuredListCell head>Prop name</StructuredListCell>
          <StructuredListCell head>Type</StructuredListCell>
          <StructuredListCell head>Default value</StructuredListCell>
          <StructuredListCell head>Description</StructuredListCell>
        </StructuredListRow>
      </StructuredListHead>
      <StructuredListBody>
        {#each component.props.sort((a, b) => {
          if (a.reactive > b.reactive) return -1;
        }) as prop (prop.name)}
          <StructuredListRow>
            <StructuredListCell noWrap>
              <InlineSnippet code={prop.name} />
              {#if prop.reactive}
                <div
                  style="white-space: nowrap; margin-top: var(--cds-spacing-03); margin-bottom: var(--cds-spacing-{prop.isRequired
                    ? '01'
                    : '03'})"
                >
                  <Tag style="margin-left: 0" size="sm" type="cyan">
                    Reactive
                  </Tag>
                </div>
              {/if}
              {#if prop.isRequired}
                <Tag size="sm" type="magenta">Required</Tag>
              {/if}
            </StructuredListCell>
            <StructuredListCell>
              {#each (prop.type || "").split(" | ") as type, i (type)}
                <div
                  class="cell"
                  style="z-index: {(prop.type || '').split(' | ').length - i}"
                >
                  {#if type.startsWith("HTML")}
                    <OutboundLink
                      href="{mdn_api}{type}"
                      style="white-space: nowrap"
                    >
                      {type}
                    </OutboundLink>
                  {:else if type in typeMap}
                    <div
                      style="display: inline-flex; max-width: 200px;"
                      style:word-break={/\s/.test(type) || type.length > 20
                        ? "break-word"
                        : "normal"}
                    >
                      <PreviewTypeScript
                        type="inline"
                        noFormat
                        code={typeMap[type]}
                      />
                    </div>
                  {:else if type.startsWith("(")}
                    <div
                      style="display: inline-flex; max-width: 180px; word-break: break-word;"
                    >
                      <PreviewTypeScript type="inline" noFormat code={type} />
                    </div>
                  {:else}
                    <div
                      style="display: inline-flex; max-width: 200px;"
                      style:word-break={/\s/.test(type) || type.length > 20
                        ? "break-word"
                        : "normal"}
                    >
                      <PreviewTypeScript type="inline" noFormat code={type} />
                    </div>
                  {/if}
                </div>
              {/each}
            </StructuredListCell>
            <StructuredListCell>
              {#if /\s+/.test(prop.value)}
                {#if prop.value.length > 100}
                  <div style="display: inline-flex">
                    <Button
                      kind="ghost"
                      size="sm"
                      icon={Code}
                      iconDescription="View full code"
                      on:click={() => {
                        full_code = prop.value;
                        full_code_prop = prop.name;
                      }}
                    />
                  </div>
                {:else}
                  <PreviewTypeScript
                    type="inline"
                    noFormat
                    code={prop.value.replace(/\s+/g, " ")}
                  />
                {/if}
              {:else if prop.value === undefined}
                <em>undefined</em>
              {:else}
                <PreviewTypeScript type="inline" noFormat code={prop.value} />
              {/if}
            </StructuredListCell>
            <StructuredListCell>
              {#if prop.description}
                {#each prop.description.split("\n") as line}
                  <div class="description">
                    {@html line
                      .replace(/\</g, "&lt;")
                      .replace(/\>/g, "&gt;")
                      .replace(/`(.*?)`/g, "<code>$1</code>")}.
                  </div>
                {/each}
              {:else}
                <div class="description">No description available.</div>
              {/if}
            </StructuredListCell>
          </StructuredListRow>
        {/each}
      </StructuredListBody>
    </StructuredList>
  </div>
{:else}
  <p class="my-layout-01-03">No props.</p>
{/if}

<h2 id="typedefs">Typedefs</h2>

{#if component.typedefs.length > 0}
  <PreviewTypeScript code={component.typedefs.map((t) => t.ts).join(";\n\n")} />
{:else}
  <p class="my-layout-01-03">No typedefs.</p>
{/if}

<h2 id="slots">Slots</h2>
{#if component.slots.length > 0}
  <UnorderedList class="my-layout-01-03">
    {#each component.slots as slot (slot.name)}
      <ListItem>{slot.default ? "default" : slot.name}</ListItem>
    {/each}
  </UnorderedList>
{:else}
  <p class="my-layout-01-03">No slots.</p>
{/if}

<h2 id="forwarded-events">Forwarded events</h2>
{#if forwarded_events.length > 0}
  <UnorderedList class="my-layout-01-03">
    {#each forwarded_events as event (event.name)}
      <ListItem>on:{event.name}</ListItem>
    {/each}
  </UnorderedList>
{:else}
  <p class="my-layout-01-03">No forwarded events.</p>
{/if}

<h2 id="dispatched-events">Dispatched events</h2>

{#if dispatched_events.length > 0}
  {@const hasDescription = dispatched_events.find((el) => el.description)}
  <StructuredList flush>
    <StructuredListHead>
      <StructuredListRow>
        <StructuredListCell>Event name</StructuredListCell>
        <StructuredListCell>
          <PreviewTypeScript type="inline" noFormat code="event.detail" />
        </StructuredListCell>
        {#if hasDescription}
          <StructuredListCell>Description</StructuredListCell>
        {/if}
      </StructuredListRow>
    </StructuredListHead>
    <StructuredListBody>
      {#each dispatched_events as event (event.name)}
        <StructuredListRow>
          <StructuredListCell>
            <strong>on:{event.name}</strong>
          </StructuredListCell>
          <StructuredListCell>
            <PreviewTypeScript code={"type EventDetail = " + event.detail} />
          </StructuredListCell>
          <StructuredListCell>
            {event.description ?? ""}
          </StructuredListCell>
        </StructuredListRow>
      {/each}
    </StructuredListBody>
  </StructuredList>
{:else}
  <p class="my-layout-01-03">No dispatched events.</p>
{/if}

<h2 id="rest-props">$$restProps</h2>

<div class="my-layout-01-03">
  {#if component.rest_props}
    <code>{component.moduleName}</code>
    spreads
    <code>$$restProps</code>
    to the
    {#if component.rest_props.type === "Element"}
      <code>{component.rest_props.name}</code>
      element.
    {:else}<code>{component.rest_props.name}</code> component.{/if}
  {:else}This component does not spread <code>restProps</code>{/if}
</div>

<Modal
  passiveModal
  open={full_code !== null}
  modalHeading="Default value"
  on:close={() => {
    full_code = null;
    full_code_prop = null;
  }}
>
  {#if full_code_prop}
    Default value for <strong>{full_code_prop}</strong>.
  {/if}
  {#if full_code}
    <PreviewTypeScript
      code={full_code.startsWith("()")
        ? `const ${full_code_prop} = ` + full_code
        : full_code}
    />
  {/if}
</Modal>

<style>
  .description {
    margin-bottom: var(--cds-spacing-04);
  }

  .cell {
    position: relative;
    z-index: 9;
    min-height: 1.25rem;
    margin-bottom: var(--cds-spacing-02);
  }

  .overflow {
    overflow-x: auto;
  }

  :global(.my-layout-01-03) {
    margin-top: var(--cds-layout-01);
    margin-bottom: var(--cds-layout-03);
  }

  :global(.overflow .bx--structured-list) {
    margin-top: var(--cds-layout-01);
    margin-bottom: var(--cds-layout-04);
  }

  code {
    word-break: break-word;
  }

  :global(
      .cell .bx--snippet--inline code,
      .cell .bx--snippet--single pre,
      .bx--snippet--inline code
    ) {
    white-space: pre-wrap !important;
  }
</style>
