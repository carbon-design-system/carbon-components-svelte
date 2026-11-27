<script>
  /**
   * @restProps {section}
   * @slot {{}}
   */

  /**
   * Specify the section id, the target of a link such as `#notifications`.
   * @type {string}
   */
  export let id = uniqueId();

  /**
   * Specify the section heading.
   * @type {string}
   */
  export let title = "";

  /** Specify the text under the heading. */
  export let description = "";

  /**
   * Set the kind of section. `"danger"` draws a red border around actions
   * that can't be undone, and leaves them out of the save bar's changes.
   * @type {"default" | "danger"}
   */
  export let kind = "default";

  /**
   * Specify words a search should match that the title does not say.
   * @type {ReadonlyArray<string>}
   */
  export let keywords = [];

  /**
   * Specify the text read for the number of fields with an error.
   * @type {(count: number) => string}
   */
  export let errorsText = defaultErrorsText;

  /**
   * Obtain a reference to the section HTML element.
   * @type {null | HTMLElement}
   * @bindable readonly
   */
  export let ref = null;

  import { getContext, onMount, setContext } from "svelte";
  import { readable, writable } from "svelte/store";
  import Heading from "../Heading/Heading.svelte";
  import Section from "../Heading/Section.svelte";
  import ErrorFilled from "../icons/ErrorFilled.svelte";
  import { highlightSegments } from "../utils/fuzzy-match.js";
  import { uniqueId } from "../utils/unique-id.js";

  /**
   * @param {number} count
   * @returns {string}
   */
  function defaultErrorsText(count) {
    return `${count} ${count === 1 ? "error" : "errors"}`;
  }

  /**
   * @type {null | {
   *   result: import("svelte/store").Readable<any>,
   *   stats: import("svelte/store").Readable<Map<string, { errors: number, modified: number }>>,
   *   registerSection: (entry: any) => { update: (patch: any) => void, destroy: () => void },
   * }}
   */
  const page = getContext("carbon:SettingsPage") ?? null;

  const sectionId = writable(id);
  $: sectionId.set(id);
  setContext("carbon:SettingsSection", { id: sectionId });

  /** @type {null | { update: (patch: any) => void, destroy: () => void }} */
  let registration = null;

  $: headingId = `${id}-heading`;
  $: if (registration)
    registration.update({ id, title, description, keywords });

  onMount(() => {
    if (!page) return;
    registration = page.registerSection({
      id,
      title,
      description,
      keywords,
      node: ref,
    });
    return () => registration?.destroy();
  });

  const result = page?.result ?? readable(null);
  const stats = page?.stats ?? readable(new Map());

  // A section the page has not indexed yet shows, so first paint matches
  // the server.
  $: sectionResult = $result?.sections.get(id);
  $: shown = sectionResult ? sectionResult.matched : true;
  $: titleSegments = highlightSegments(
    title,
    sectionResult?.titleIndices ?? [],
  );
  $: errorCount = $stats.get(id)?.errors ?? 0;
</script>

<section
  bind:this={ref}
  {id}
  role="group"
  aria-labelledby={$$restProps["aria-label"] ? undefined : headingId}
  hidden={shown ? undefined : true}
  class:bx--settings-section={true}
  class:bx--settings-section--danger={kind === "danger"}
  {...$$restProps}
>
  <Section tag="div" class="bx--settings-section__inner">
    <div class:bx--settings-section__header={true}>
      <Heading
        id={headingId}
        tabindex={-1}
        type="heading-03"
        class="bx--settings-section__title"
      >
        {#each titleSegments as segment, index (index)}{#if segment.match}<mark
              >{segment.text}</mark
            >{:else}{segment.text}{/if}{/each}
      </Heading>
      {#if errorCount > 0}
        <span class:bx--settings-section__badge={true}>
          <ErrorFilled size={16} />
          {errorsText(errorCount)}
        </span>
      {/if}
      {#if description}
        <p class:bx--settings-section__description={true}>{description}</p>
      {/if}
    </div>
    <div class:bx--settings-section__rows={true}>
      <slot />
    </div>
  </Section>
</section>
