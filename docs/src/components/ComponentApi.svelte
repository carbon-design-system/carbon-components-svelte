<script lang="ts">
  // Structured JSDoc tag (e.g. `@since`, `@example`) surfaced by sveld.
  type ComponentApiTag = {
    name: string;
    body: string;
  };

  // From `@deprecated` JSDoc: a message string, or `true` when no message.
  type ComponentApiDeprecated = string | true;

  type ComponentApiProp = {
    name: string;
    description?: string;
    type?: string;
    value?: string;
    isRequired?: boolean;
    reactive?: boolean;
    deprecated?: ComponentApiDeprecated;
    tags?: ComponentApiTag[];
  };

  type ComponentApiTypedef = {
    ts?: string;
  };

  type ComponentApiSlot = {
    default?: boolean;
    name?: string | null;
    slot_props?: string;
    deprecated?: ComponentApiDeprecated;
    tags?: ComponentApiTag[];
  };

  type ComponentApiEvent = {
    type?: string;
    name?: string;
    detail?: string;
    description?: string;
    deprecated?: ComponentApiDeprecated;
    tags?: ComponentApiTag[];
  };

  type ComponentApiRestProps = {
    type: string;
    name: string;
  };

  type ComponentApiData = {
    moduleName: string;
    filePath: string;
    props: ComponentApiProp[];
    slots: ComponentApiSlot[];
    events: ComponentApiEvent[];
    typedefs: ComponentApiTypedef[];
    rest_props?: ComponentApiRestProps;
  };

  export let component: ComponentApiData = {
    moduleName: "",
    filePath: "",
    props: [],
    slots: [],
    events: [],
    typedefs: [],
    rest_props: undefined,
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

  let AsyncCodeBlock: typeof import("./CodeBlock.svelte").default | undefined;

  onMount(async () => {
    AsyncCodeBlock = (await import("./CodeBlock.svelte")).default;
  });

  const mdn_api = "https://developer.mozilla.org/en-US/docs/Web/API/";
  const typeMap: Record<string, string> = {
    string: "string",
    boolean: "boolean",
    number: "number",
    null: "null",
    Date: "JavaScript Date",
  };

  // Regex to extract code blocks from @example tags.
  // As of sveld 0.33, `@example`/`@since`/`@deprecated` are surfaced as
  // structured tags rather than embedded in the description text.
  // Pattern: ```svelte\n...code...\n``` or ```svelte\n...code...```
  // The regex uses [\s\S]*? to match any character including newlines (non-greedy)
  const EXAMPLE_CODE_BLOCK_REGEX = /```svelte\s*\n([\s\S]*?)```/;

  function findTag(tags: ComponentApiTag[] | undefined, name: string) {
    return tags?.find((tag) => tag.name === name);
  }

  // Pull the svelte code block out of an `@example` tag, if present.
  function exampleCodeFromTags(tags?: ComponentApiTag[]): string | null {
    const example = findTag(tags, "example");
    if (!example) return null;

    const codeBlockMatch = example.body.match(EXAMPLE_CODE_BLOCK_REGEX);
    return codeBlockMatch ? codeBlockMatch[1].trim() : example.body.trim();
  }

  function sinceFromTags(tags?: ComponentApiTag[]): string | null {
    return findTag(tags, "since")?.body.trim() || null;
  }

  // Render a JSDoc description as light HTML: escape angle brackets, turn
  // `code` spans into <code>, and linkify bare URLs.
  function renderDescription(description: string): string {
    return description
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/https?:\/\/[^\s<]+/g, (url) => {
        const trailing = url.match(/[.,;:!?)\]]+$/)?.[0] ?? "";
        const href = url.slice(0, url.length - trailing.length);
        return `<a class="bx--link" href="${href}" target="_blank" rel="noopener noreferrer">${href}</a>${trailing}`;
      });
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

<h2 id="component-api-props" class="bx--type-productive-heading-04">Props</h2>

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
              <InlineSnippet code={prop.name} portalTooltip />
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
              {#if prop.deprecated}
                <Tag size="sm" type="red">Deprecated</Tag>
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
                      style="display: inline-flex; max-width: 220px; white-space: nowrap;"
                    >
                      <svelte:component
                        this={AsyncCodeBlock}
                        language="typescript"
                        type="inline"
                        code={typeMap[type] ?? type}
                        portalTooltip
                      />
                    </div>
                  {:else}
                    <div
                      style="display: inline-flex; max-width: 220px; word-break: break-word;"
                    >
                      <svelte:component
                        this={AsyncCodeBlock}
                        language="typescript"
                        type="inline"
                        code={type}
                        portalTooltip
                      />
                    </div>
                  {/if}
                </div>
              {/each}
            </StructuredListCell>
            <StructuredListCell>
              {#if prop.deprecated}
                <div class="deprecated">
                  <strong>Deprecated.</strong>
                  {#if typeof prop.deprecated === "string"}
                    {@html renderDescription(prop.deprecated)}
                  {/if}
                </div>
              {/if}
              {#if prop.description}
                <div class="description">
                  {@html renderDescription(prop.description)}
                </div>
              {/if}
              {#if sinceFromTags(prop.tags)}
                {@const since = sinceFromTags(prop.tags)}
                <div class="since">Available since {since}</div>
              {/if}
              {#if exampleCodeFromTags(prop.tags)}
                {@const exampleCode = exampleCodeFromTags(prop.tags)}
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
                    this={AsyncCodeBlock}
                    language="typescript"
                    type="multi"
                    code={exampleCode ?? ""}
                    portalTooltip
                  />
                </div>
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
                    this={AsyncCodeBlock}
                    language="typescript"
                    type={/\n/.test(prop.value ?? "") ? "multi" : "inline"}
                    code={prop.value ?? ""}
                    portalTooltip
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

<h2 id="component-api-typedefs" class="bx--type-productive-heading-04">
  Typedefs
</h2>

{#if component.typedefs.length > 0}
  <div class="my-layout-01-03">
    <svelte:component
      this={AsyncCodeBlock}
      language="typescript"
      code={component.typedefs.map((t) => t.ts ?? "").join("\n")}
    />
  </div>
{:else}
  <p class="my-layout-01-03">No typedefs.</p>
{/if}

<h2 id="component-api-slots" class="bx--type-productive-heading-04">Slots</h2>
{#if component.slots.length > 0}
  <div class="overflow">
    <StructuredList flush condensed>
      <StructuredListHead>
        <StructuredListRow head>
          <StructuredListCell head>Slot name</StructuredListCell>
          <StructuredListCell head>Slot detail</StructuredListCell>
        </StructuredListRow>
      </StructuredListHead>
      <StructuredListBody>
        {#each component.slots as slot (slot.name ?? "default")}
          <StructuredListRow>
            <StructuredListCell>
              <strong>{slot.default ? "default" : slot.name}</strong>
            </StructuredListCell>
            <StructuredListCell>
              <svelte:component
                this={AsyncCodeBlock}
                language="typescript"
                type={/\n/.test(slot.slot_props ?? "") ? "multi" : "inline"}
                code={slot.slot_props ?? ""}
                portalTooltip
              />
            </StructuredListCell>
          </StructuredListRow>
        {/each}
      </StructuredListBody>
    </StructuredList>
  </div>
{:else}
  <p class="my-layout-01-03">No slots.</p>
{/if}

<h2 id="component-api-forwarded-events" class="bx--type-productive-heading-04">
  Forwarded events
</h2>
{#if forwarded_events.length > 0}
  <UnorderedList class="my-layout-01-03">
    {#each forwarded_events as forwarded_event (forwarded_event.name)}
      <ListItem>on:{forwarded_event.name}</ListItem>
    {/each}
  </UnorderedList>
{:else}
  <p class="my-layout-01-03">No forwarded events.</p>
{/if}

<h2 id="component-api-dispatched-events" class="bx--type-productive-heading-04">
  Dispatched events
</h2>

{#if dispatched_events.length > 0}
  {@const hasDescription = dispatched_events.find((el) => el.description)}
  <div class="overflow">
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
                this={AsyncCodeBlock}
                language="typescript"
                type={/\n/.test(dispatched_event.detail ?? "")
                  ? "multi"
                  : "inline"}
                code={dispatched_event.detail ?? ""}
                portalTooltip
              />
            </StructuredListCell>
            <StructuredListCell>
              {dispatched_event.description ?? ""}
            </StructuredListCell>
          </StructuredListRow>
        {/each}
      </StructuredListBody>
    </StructuredList>
  </div>
{:else}
  <p class="my-layout-01-03">No dispatched events.</p>
{/if}

<h2 id="component-api-rest-props" class="bx--type-productive-heading-04">
  $$restProps
</h2>

<div class="my-layout-01-03">
  {#if component.rest_props}
    <code>{component.moduleName}</code>
    spreads
    <code>$$restProps</code>
    to the
    {#if component.rest_props.type === "Element"}
      <code>{component.rest_props.name}</code>
      element.
    {:else}
      <code>{component.rest_props.name}</code>
      component.
    {/if}
  {:else}
    This component does not spread <code>restProps</code>
  {/if}
</div>

<style>
  .description {
    margin-bottom: var(--cds-spacing-04);
    width: 80%;
  }

  .deprecated {
    margin-bottom: var(--cds-spacing-04);
    width: 80%;
    color: var(--cds-text-error, #da1e28);
  }

  .since {
    margin-bottom: var(--cds-spacing-04);
    color: var(--cds-text-02, #525252);
    font-size: var(--cds-label-01-font-size, 0.75rem);
  }

  .cell {
    position: relative;
    z-index: 9;
    min-height: 1.25rem;
    margin-bottom: var(--cds-spacing-02);
  }

  .overflow {
    overflow-x: auto;
    max-width: 100%;
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
