<script>
  /**
   * @typedef {object} SettingsNavSection
   * @property {string} id - The id of the `SettingsSection`.
   * @property {string} text - The text of the link.
   */

  /**
   * @restProps {div}
   */

  /**
   * Specify the sections to list, in page order. They come from a prop, not
   * from the sections themselves, so the list is in the server's markup
   * and nothing moves once the page hydrates.
   * @type {ReadonlyArray<SettingsNavSection>}
   */
  export let sections = [];

  /**
   * Specify the id of the active section. It follows the scroll position.
   * @type {string | undefined}
   * @bindable writable
   */
  export let selectedId = undefined;

  /** Specify the accessible name of the section list. */
  export let labelText = "Settings sections";

  /** Specify the label of the section menu shown on small screens. */
  export let jumpText = "Jump to section";

  /**
   * Specify the text read for a section's number of fields with an error.
   * @type {(count: number) => string}
   */
  export let errorsText = defaultErrorsText;

  /** Specify the text read for a section with unsaved changes. */
  export let modifiedText = "modified";

  /**
   * Specify the element that scrolls the sections. Defaults to the window.
   * @type {HTMLElement | null}
   */
  export let scrollContainer = null;

  /**
   * Specify the distance in pixels from the top of the scroll container at
   * which a section becomes active. Match the height of a sticky header.
   * @type {number | undefined}
   */
  export let scrollOffset = undefined;

  /** Set an id for the top-level element, from which the section menu's id derives. */
  export let id = uniqueId();

  /**
   * Obtain a reference to the top-level HTML element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { getContext } from "svelte";
  import { readable } from "svelte/store";
  import Dropdown from "../Dropdown/Dropdown.svelte";
  import TableOfContents from "../TableOfContents/TableOfContents.svelte";
  import TableOfContentsItem from "../TableOfContents/TableOfContentsItem.svelte";
  import ErrorFilled from "../icons/ErrorFilled.svelte";
  import { focusSection, scrollToSection } from "../utils/active-section.js";
  import { focusQuietly } from "../utils/focus.js";
  import { uniqueId } from "../utils/unique-id.js";

  /**
   * @param {number} count
   * @returns {string}
   */
  function defaultErrorsText(count) {
    return `${count} ${count === 1 ? "error" : "errors"}`;
  }

  /** @type {null | any} */
  const page = getContext("carbon:SettingsPage") ?? null;
  const result = page?.result ?? readable(null);
  const stats = page?.stats ?? readable(new Map());

  // A search hides the sections it rules out, so the list is the results.
  $: visible = sections.filter(
    (section) => $result?.sections.get(section.id)?.matched !== false,
  );
  // The server marks the first section, as the reader starts at the top of
  // the page, so the list doesn't change once the scroll spy takes over.
  $: if (selectedId === undefined && visible.length > 0) {
    selectedId = visible[0].id;
  }

  $: items = visible.map((section) => {
    const errors = $stats.get(section.id)?.errors ?? 0;
    const modified = ($stats.get(section.id)?.modified ?? 0) > 0;
    return {
      id: section.id,
      text:
        errors > 0 ? `${section.text}, ${errorsText(errors)}` : section.text,
      title: section.text,
      errors,
      modified,
    };
  });

  /** @param {string} id */
  function focusHeading(id) {
    if (page) {
      page.focusHeading(id);
      return;
    }
    const heading = document.getElementById(`${id}-heading`);
    if (heading) focusQuietly(heading, { preventScroll: true });
  }

  // The link scrolls to the section, which a screen reader user only
  // notices once focus is there. The table of contents moves focus to the
  // section element in a frame, so this waits for it.
  /** @param {string} id */
  function handleLinkClick(id) {
    setTimeout(() => focusHeading(id));
  }

  /** @param {CustomEvent<{ selectedId: string }>} event */
  function handleJump(event) {
    const id = event.detail.selectedId;
    const target = document.getElementById(id);
    if (!target) return;
    scrollToSection(target, {
      container: scrollContainer,
      offset: scrollOffset,
    });
    try {
      window.history.replaceState(window.history.state, "", `#${id}`);
    } catch {
      // A sandboxed frame can't write its URL.
    }
    focusSection(target);
    focusHeading(id);
  }
</script>

<div bind:this={ref} {id} class:bx--settings-nav={true} {...$$restProps}>
  <div class:bx--settings-nav__rail={true}>
    <TableOfContents
      bind:selectedId
      {labelText}
      {scrollContainer}
      {scrollOffset}
    >
      {#each items as item (item.id)}
        <TableOfContentsItem
          href="#{item.id}"
          on:click={() => handleLinkClick(item.id)}
        >
          <span class:bx--settings-nav__text={true}>{item.title}</span>
          {#if item.errors > 0}
            <span class:bx--settings-nav__badge={true}>
              <ErrorFilled size={16} />
              <span class:bx--visually-hidden={true}
                >{errorsText(item.errors)}</span
              >
            </span>
          {:else if item.modified}
            <span
              class:bx--settings-nav__dot={true}
              role="img"
              aria-label={modifiedText}
            ></span>
          {/if}
        </TableOfContentsItem>
      {/each}
    </TableOfContents>
  </div>
  <div class:bx--settings-nav__jump={true}>
    <Dropdown
      id="{id}-jump"
      labelText={jumpText}
      {items}
      {selectedId}
      on:select={handleJump}
    />
  </div>
</div>
