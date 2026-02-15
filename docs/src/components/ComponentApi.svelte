<script>
  export let component = {
    props: [],
    slots: [],
    events: [],
    rest_props: undefined,
    typedefs: [],
  };

  import {
    ListItem,
    OutboundLink,
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow,
    Tag,
    UnorderedList,
  } from "carbon-components-svelte";
  import { onMount } from "svelte";
  import InlineSnippet from "./InlineSnippet.svelte";

  let AsyncPreviewTypeScript;

  onMount(async () => {
    AsyncPreviewTypeScript = (await import("./PreviewTypeScript.svelte"))
      .default;
  });

  const mdn_api = "https://developer.mozilla.org/en-US/docs/Web/API/";
  const typeMap = {
    string: "string",
    boolean: "boolean",
    number: "number",
    null: "null",
    Date: "JavaScript Date",
  };

  // Regex to extract code blocks from @example annotations
  // Pattern: ```svelte\n...code...\n``` or ```svelte\n...code...```
  // The regex uses [\s\S]*? to match any character including newlines (non-greedy)
  const EXAMPLE_CODE_BLOCK_REGEX = /```svelte\s*\n([\s\S]*?)```/;

  /**
   * Parse description to extract main text and example code
   * @param {string} description - The full description string
   * @returns {{ mainDescription: string, exampleCode: string | null }}
   */
  function parseDescription(description) {
    if (!description) {
      return { mainDescription: "", exampleCode: null };
    }

    const exampleIndex = description.indexOf("@example");
    if (exampleIndex === -1) {
      return { mainDescription: description, exampleCode: null };
    }

    const mainDescription = description.slice(0, exampleIndex).trim();
    const exampleSection = description.slice(exampleIndex);

    // Extract code block from example section
    const codeBlockMatch = exampleSection.match(EXAMPLE_CODE_BLOCK_REGEX);
    const exampleCode = codeBlockMatch ? codeBlockMatch[1].trim() : null;

    return { mainDescription, exampleCode };
  }

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
          <StructuredListCell head>Description</StructuredListCell>
        </StructuredListRow>
      </StructuredListHead>
      <StructuredListBody>
        {#each component.props.sort((a, b) => {
          // Sort props so required props are listed first, then reactive props.

          if (a.isRequired !== b.isRequired) {
            return b.isRequired ? 1 : -1;
          }

          if (a.reactive !== b.reactive) {
            return b.reactive ? 1 : -1;
          }

          return 0;
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
                      style="display: inline-flex; max-width: 220px; word-break: break-word;"
                    >
                      <svelte:component
                        this={AsyncPreviewTypeScript}
                        type="inline"
                        code={typeMap[type]}
                      />
                    </div>
                  {:else}
                    <div
                      style="display: inline-flex; max-width: 220px; word-break: break-word;"
                    >
                      <svelte:component
                        this={AsyncPreviewTypeScript}
                        type="inline"
                        code={type}
                      />
                    </div>
                  {/if}
                </div>
              {/each}
            </StructuredListCell>
            <StructuredListCell>
              {#if prop.description}
                {@const parsed = parseDescription(prop.description)}
                {#if parsed.mainDescription}
                  <div class="description">
                    {@html parsed.mainDescription
                      .replace(/\</g, "&lt;")
                      .replace(/\>/g, "&gt;")
                      .replace(/`(.*?)`/g, "<code>$1</code>")}
                  </div>
                {/if}
                {#if parsed.exampleCode}
                  <div
                    style:margin-top="var(--cds-layout-02)"
                    style:margin-bottom="var(--cds-spacing-03)"
                  >
                    <strong>Example</strong>
                  </div>
                  <div
                    style:margin-bottom="var(--cds-layout-02)"
                    style:max-width="85%"
                  >
                    <svelte:component
                      this={AsyncPreviewTypeScript}
                      type="multi"
                      code={parsed.exampleCode}
                    />
                  </div>
                {/if}
              {/if}
              <div
                style:margin-top="var(--cds-layout-02)"
                style:margin-bottom="var(--cds-spacing-03)"
              >
                <strong>Default value</strong>
              </div>
              <div
                style:margin-bottom="var(--cds-layout-01)"
                style:max-width="85%"
              >
                {#if prop.value === undefined}
                  <em>undefined</em>
                {:else}
                  <svelte:component
                    this={AsyncPreviewTypeScript}
                    type={/\n/.test(prop.value) ? "multi" : "inline"}
                    code={prop.value}
                  />
                {/if}
              </div>
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
  <div class="my-layout-01-03">
    <svelte:component
      this={AsyncPreviewTypeScript}
      code={component.typedefs.map((t) => t.ts).join("\n")}
    />
  </div>
{:else}
  <p class="my-layout-01-03">No typedefs.</p>
{/if}

<h2 id="slots">Slots</h2>
{#if component.slots.length > 0}
  <StructuredList flush condensed class="my-layout-01-03">
    <StructuredListHead>
      <StructuredListRow head>
        <StructuredListCell head>Slot name</StructuredListCell>
        <StructuredListCell head>Slot detail</StructuredListCell>
      </StructuredListRow>
    </StructuredListHead>
    <StructuredListBody>
      {#each component.slots as slot (slot.name)}
        <StructuredListRow>
          <StructuredListCell>
            <strong>{slot.default ? "default" : slot.name}</strong>
          </StructuredListCell>
          <StructuredListCell>
            <svelte:component
              this={AsyncPreviewTypeScript}
              type={/\n/.test(slot.slot_props) ? "multi" : "inline"}
              code={slot.slot_props}
            />
          </StructuredListCell>
        </StructuredListRow>
      {/each}
    </StructuredListBody>
  </StructuredList>
{:else}
  <p class="my-layout-01-03">No slots.</p>
{/if}

<h2 id="forwarded-events">Forwarded events</h2>
{#if forwarded_events.length > 0}
  <UnorderedList class="my-layout-01-03">
    {#each forwarded_events as forwarded_event (forwarded_event.name)}
      <ListItem>on:{forwarded_event.name}</ListItem>
    {/each}
  </UnorderedList>
{:else}
  <p class="my-layout-01-03">No forwarded events.</p>
{/if}

<h2 id="dispatched-events">Dispatched events</h2>

{#if dispatched_events.length > 0}
  {@const hasDescription = dispatched_events.find((el) => el.description)}
  <StructuredList flush condensed>
    <StructuredListHead>
      <StructuredListRow head>
        <StructuredListCell head>Event name</StructuredListCell>
        <StructuredListCell head>Event detail</StructuredListCell>
        {#if hasDescription}
          <StructuredListCell head>Description</StructuredListCell>
        {/if}
      </StructuredListRow>
    </StructuredListHead>
    <StructuredListBody>
      {#each dispatched_events as dispatched_event (dispatched_event.name)}
        <StructuredListRow>
          <StructuredListCell>
            <strong>on:{dispatched_event.name}</strong>
          </StructuredListCell>
          <StructuredListCell>
            <svelte:component
              this={AsyncPreviewTypeScript}
              type={/\n/.test(dispatched_event.detail) ? "multi" : "inline"}
              code={dispatched_event.detail}
            />
          </StructuredListCell>
          <StructuredListCell>
            {dispatched_event.description ?? ""}
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

<style>
  .description {
    margin-bottom: var(--cds-spacing-04);
    width: 80%;
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
</style>
