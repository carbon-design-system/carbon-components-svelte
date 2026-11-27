<script context="module">
  import { focusQuietly } from "../utils/focus.js";

  /**
   * @typedef {object} SettingsSearchState
   * @property {string} query - The trimmed query.
   * @property {number} count - How many settings match.
   * @property {Map<string, import("./filter-settings.js").SettingsSearchSectionResult>} sections - Each section's result by id.
   * @property {Map<string, import("./filter-settings.js").SettingsSearchItemResult>} items - Each row's result by its control id.
   */

  /**
   * Move focus to the first control in `node`, not its reset button.
   * @param {HTMLElement} node
   */
  function focusControl(node) {
    const control = node
      .querySelector(".bx--settings-row__control")
      ?.querySelector(
        'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
    if (control instanceof HTMLElement) focusQuietly(control);
  }
</script>

<script>
  /**
   * @restProps {div}
   * @slot {{ query: string; resultCount: number }}
   * @event {import("./create-settings.js").SettingsOutcome} save
   * @event {null} discard
   */

  /**
   * Specify the settings state from `createSettings`.
   * @type {import("./create-settings.js").SettingsStore<any>}
   */
  export let settings = createSettings({});

  /**
   * Specify the work to run when the user saves. Resolve `{ errors }` to
   * reject fields, or throw to fail the save; either leaves the page dirty
   * and moves focus to the first field with a message.
   * @type {undefined | ((values: any) => void | { errors?: Record<string, string> } | Promise<void | { errors?: Record<string, string> }>)}
   */
  export let save = undefined;

  /**
   * Specify the search query. Rows, sections and the section list hide
   * unless they match it.
   * @bindable writable
   */
  export let query = "";

  /**
   * The number of settings that match `query`, or all of them with no query.
   * @bindable readonly
   */
  export let resultCount = 0;

  /** Specify the text announced once a save went through. */
  export let savedText = "Settings saved";

  /** Specify the text announced when the page first has unsaved changes. */
  export let unsavedText = "You have unsaved changes";

  /**
   * Specify the text announced when a save failed.
   * @type {(count: number) => string}
   */
  export let errorText = defaultErrorText;

  /**
   * Specify the text announced when a search settles.
   * @type {(count: number, query: string) => string}
   */
  export let resultsText = defaultResultsText;

  /** Specify the heading of the prompt shown when the user tries to leave. */
  export let leaveTitle = "Discard unsaved changes?";

  /** Specify the body of the prompt shown when the user tries to leave. */
  export let leaveText = "Your changes will be lost.";

  /** Specify the leave prompt's discard button text. */
  export let discardText = "Discard";

  /** Specify the leave prompt's keep-editing button text. */
  export let keepText = "Keep editing";

  /**
   * Obtain a reference to the top-level HTML element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, onMount, setContext, tick } from "svelte";
  import { derived, writable } from "svelte/store";
  import Section from "../Heading/Section.svelte";
  import UnsavedChangesPrompt from "../UnsavedChanges/UnsavedChangesPrompt.svelte";
  import { scrollToSection } from "../utils/active-section.js";
  import { batchStoreUpdates } from "../utils/batch-store-updates.js";
  import { sortByDomOrder } from "../utils/sort-by-dom-order.js";
  import { addPooledListener } from "../utils/window-listener-pool.js";
  import { createSettings } from "./create-settings.js";
  import { filterSettings } from "./filter-settings.js";

  /**
   * @param {number} count
   * @returns {string}
   */
  function defaultErrorText(count) {
    if (count === 0) return "Settings could not be saved";
    return `${count} ${count === 1 ? "setting" : "settings"} could not be saved`;
  }

  /**
   * @param {number} count
   * @param {string} query
   * @returns {string}
   */
  function defaultResultsText(count, query) {
    if (count === 0) return `No settings match ${query}`;
    return `${count} ${count === 1 ? "setting matches" : "settings match"} ${query}`;
  }

  const dispatch = createEventDispatcher();

  /**
   * @typedef {{ id: string, title: string, description?: string, keywords?: ReadonlyArray<string>, node: HTMLElement | null, heading: HTMLElement | null }} SectionEntry
   * @typedef {{ key: string, sectionId: string, name?: string, label: string, description?: string, keywords?: ReadonlyArray<string>, node: HTMLElement | null }} RowEntry
   */

  /** @type {Map<string, SectionEntry>} */
  const sections = new Map();
  /** @type {Map<string, RowEntry>} */
  const rows = new Map();
  const version = writable(0);
  const touch = batchStoreUpdates(version);

  const queryStore = writable(query);
  $: queryStore.set(query);

  const { dirty, errors, status } = settings;

  // Everything a row or a section reads about the search comes from one
  // derived store, so a keystroke in the search field filters once.
  /** @type {import("svelte/store").Readable<SettingsSearchState>} */
  const result = derived([version, queryStore], ([, $query]) => {
    /** @type {Map<string, RowEntry[]>} */
    const bySection = new Map();
    for (const row of rows.values()) {
      const list = bySection.get(row.sectionId) ?? [];
      list.push(row);
      bySection.set(row.sectionId, list);
    }
    const index = [...sections.values()].map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      keywords: section.keywords,
      items: (bySection.get(section.id) ?? []).map((row) => ({
        id: row.key,
        label: row.label,
        description: row.description,
        keywords: row.keywords,
      })),
    }));
    // A row outside any section matches on its own fields.
    const orphans = [...bySection].filter(([id]) => !sections.has(id));
    for (const [id, list] of orphans) {
      index.push({
        id,
        title: "",
        description: undefined,
        keywords: undefined,
        items: list.map((row) => ({
          id: row.key,
          label: row.label,
          description: row.description,
          keywords: row.keywords,
        })),
      });
    }
    const found = filterSettings(index, $query);
    /** @type {Map<string, import("./filter-settings.js").SettingsSearchSectionResult>} */
    const sectionResults = new Map();
    /** @type {Map<string, import("./filter-settings.js").SettingsSearchItemResult>} */
    const itemResults = new Map();
    for (const section of found.sections) {
      sectionResults.set(section.id, section);
      for (const item of section.items) itemResults.set(item.id, item);
    }
    return {
      query: found.query,
      count: found.count,
      sections: sectionResults,
      items: itemResults,
    };
  });

  /** @type {import("svelte/store").Readable<Map<string, { errors: number, modified: number }>>} */
  const stats = derived(
    [version, errors, settings.modified],
    ([, $errors, $modified]) => {
      /** @type {Map<string, { errors: number, modified: number }>} */
      const map = new Map();
      for (const row of rows.values()) {
        if (!row.name) continue;
        const entry = map.get(row.sectionId) ?? { errors: 0, modified: 0 };
        if (row.name in $errors) entry.errors++;
        if ($modified.has(row.name)) entry.modified++;
        map.set(row.sectionId, entry);
      }
      return map;
    },
  );

  $: resultCount = $result.count;

  /** @param {SectionEntry} entry */
  function registerSection(entry) {
    sections.set(entry.id, entry);
    touch((n) => n + 1);
    return {
      /** @param {Partial<SectionEntry>} patch */
      update(patch) {
        Object.assign(entry, patch);
        touch((n) => n + 1);
      },
      destroy() {
        if (sections.get(entry.id) === entry) sections.delete(entry.id);
        touch((n) => n + 1);
      },
    };
  }

  /** @param {RowEntry} entry */
  function registerRow(entry) {
    rows.set(entry.key, entry);
    touch((n) => n + 1);
    return {
      /** @param {Partial<RowEntry>} patch */
      update(patch) {
        Object.assign(entry, patch);
        touch((n) => n + 1);
      },
      destroy() {
        if (rows.get(entry.key) === entry) rows.delete(entry.key);
        touch((n) => n + 1);
      },
    };
  }

  /**
   * Move focus to a section's heading, where a link to the section lands.
   * @param {string} id
   */
  function focusHeading(id) {
    const heading = document.getElementById(`${id}-heading`);
    if (heading) focusQuietly(heading, { preventScroll: true });
  }

  /** @param {boolean} [scroll] */
  function focusHash(scroll = false) {
    let id = window.location.hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {
      // Keep the raw hash.
    }
    const section = id ? document.getElementById(id) : null;
    if (!section || !document.getElementById(`${id}-heading`)) return;
    // The browser looked for the target before the section existed.
    if (scroll) scrollToSection(section);
    focusHeading(id);
  }

  /** The last control the user was in, which focus returns to when the save bar goes away. */
  /** @type {HTMLElement | null} */
  let lastFocused = null;

  /** @param {Event} event */
  function trackFocus(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !ref?.contains(target)) return;
    if (target.closest(".bx--settings-save-bar")) return;
    lastFocused = target;
  }

  function inSaveBar() {
    const active = document.activeElement;
    return (
      !!active &&
      !!ref?.querySelector(".bx--settings-save-bar")?.contains(active)
    );
  }

  /** Give focus back to the field the user came from. */
  async function returnFocus() {
    await tick();
    if (lastFocused?.isConnected) focusQuietly(lastFocused);
  }

  async function focusFirstError() {
    await tick();
    const failing = sortByDomOrder(
      [...rows.values()].filter((row) => row.name && row.name in $errors),
    );
    const node = failing[0]?.node;
    if (node) focusControl(node);
  }

  /** @returns {Promise<import("./create-settings.js").SettingsOutcome>} */
  async function runSave() {
    const fromBar = inSaveBar();
    const outcome = await settings.save(save ?? (() => {}));
    dispatch("save", outcome);
    if (outcome.ok) {
      if (fromBar) await returnFocus();
    } else {
      await focusFirstError();
    }
    return outcome;
  }

  async function runDiscard() {
    const fromBar = inSaveBar();
    settings.discard();
    dispatch("discard");
    if (fromBar) await returnFocus();
  }

  setContext("carbon:SettingsPage", {
    settings,
    result,
    stats,
    registerSection,
    registerRow,
    focusHeading,
    save: runSave,
    discard: runDiscard,
  });

  let announcement = "";
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let announceTimer;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let searchTimer;

  // Clearing first makes a repeated message read again.
  /** @param {string} text */
  function announce(text) {
    clearTimeout(announceTimer);
    announcement = "";
    if (!text) return;
    announceTimer = setTimeout(() => {
      announcement = text;
    }, 50);
  }

  let prevDirty = false;
  /** @param {boolean} value */
  function announceDirty(value) {
    if (value && !prevDirty) announce(unsavedText);
    prevDirty = value;
  }
  $: announceDirty($dirty);

  /** @type {string | undefined} */
  let prevStatus;
  /** @param {string} state */
  function announceStatus(state) {
    if (state === prevStatus) return;
    prevStatus = state;
    if (state === "saved") announce(savedText);
    else if (state === "error")
      announce(errorText(Object.keys($errors).length));
  }
  $: announceStatus($status.state);

  /**
   * @param {string} text
   * @param {number} count
   */
  function queueSearchAnnouncement(text, count) {
    clearTimeout(searchTimer);
    if (!text.trim()) return;
    // Wait for the typing to settle: one announcement per word, not per key.
    searchTimer = setTimeout(
      () => announce(resultsText(count, text.trim())),
      500,
    );
  }
  $: queueSearchAnnouncement(query, resultCount);

  // The leave guard follows the page: dirty arms the browser's prompt.
  $: settings.unsaved.set("settings", $dirty);

  onMount(() => {
    // A page still loading ends with the browser's own jump to the hash,
    // which also drops focus, so focus the heading after that.
    const focusOnLoad = () => setTimeout(() => focusHash(true));
    if (document.readyState === "complete") {
      tick().then(focusOnLoad);
    } else {
      window.addEventListener("load", focusOnLoad, { once: true });
    }
    const stopFocus = addPooledListener("focusin", trackFocus, true);
    const stopHash = addPooledListener("hashchange", () => focusHash());
    return () => {
      window.removeEventListener("load", focusOnLoad);
      stopFocus();
      stopHash();
      clearTimeout(announceTimer);
      clearTimeout(searchTimer);
      settings.unsaved.clear("settings");
    };
  });
</script>

<div bind:this={ref} class:bx--settings-page={true} {...$$restProps}>
  <Section tag="div">
    <slot {query} {resultCount} />
  </Section>
  <div
    class:bx--visually-hidden={true}
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    {announcement}
  </div>
  <UnsavedChangesPrompt
    store={settings.unsaved}
    title={leaveTitle}
    confirmText={discardText}
    cancelText={keepText}
  >
    {leaveText}
  </UnsavedChangesPrompt>
</div>
