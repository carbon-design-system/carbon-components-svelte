<script>
  /**
   * The field and menu shared by `TimezonePicker`, `LanguagePicker` and
   * `CountryPicker`: a `ComboBox` over a list a source builds from the
   * browser's `Intl` data. The source owns the data (the list, the names, the
   * search text); this component owns the field, the value and the events.
   * @restProps {input}
   * @slot {{}} labelChildren
   * @event {{ value: string; label: string; metadata?: any; [key: string]: any }} change
   * @event {null} clear
   * @event {{ trigger: string }} open
   * @event {{ trigger: string }} close
   */

  /**
   * What the picker lists.
   * @type {"timeZone" | "language" | "region"}
   */
  export let kind;

  /**
   * The list and the data behind it, from `createTimeZoneSource`,
   * `createLanguageSource` or `createRegionSource`.
   * @type {{
   *   items: ReadonlyArray<{ id: string; text: string; group?: string; search: string }>;
   *   ensure: () => void;
   *   warm: (deadline: number) => boolean;
   *   detail: (id: string) => any;
   *   resolve: (value: string) => string;
   *   detect: () => string;
   * }}
   */
  export let source;

  /**
   * The code: an IANA zone, a BCP 47 tag or an ISO 3166 region. `""` for none.
   * @type {string}
   * @bindable writable
   */
  export let value = "";

  /** The locale the names are written in. */
  export let locale = "en";

  /**
   * Fill an empty `value` with the source's guess once the picker has mounted.
   * Never runs on the server, so the server and the first client paint agree.
   */
  export let detect = false;

  /**
   * How a region's flag shows in the menu.
   * @type {"emoji" | "badge" | "none"}
   */
  export let flag = "none";

  /**
   * Add to the `change` event's detail.
   * @type {((value: string) => any) | undefined}
   */
  export let metadata = undefined;

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

  /** Specify the placeholder text */
  export let placeholder = "";

  /** Specify the helper text */
  export let helperText = "";

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  /** Specify the invalid state text */
  export let invalidText = "";

  /** Set to `true` to indicate a warning state */
  export let warn = false;

  /** Specify the warning state text */
  export let warnText = "";

  /** Set to `true` to disable the field */
  export let disabled = false;

  /** Set to `true` to use the read-only variant */
  export let readonly = false;

  /**
   * Set to `true` to require a value.
   */
  export let required = false;

  /**
   * Set the size of the field.
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /**
   * Set to `true` to open the menu.
   * @bindable writable
   */
  export let open = false;

  /**
   * Specify the direction of the menu.
   * @type {"bottom" | "top"}
   */
  export let direction = "bottom";

  /**
   * Set to `true` to always render the menu in a portal, or `false` to keep
   * it in place. Left unset, the menu moves to a portal inside a Modal.
   * @type {boolean | undefined}
   */
  export let portalMenu = undefined;

  /** Specify the message shown when nothing matches the query. */
  export let emptyText = "No results";

  /**
   * Build the message announced to screen readers as typing changes the
   * number of matches.
   * @type {(count: number) => string}
   */
  export let filterResultsText = function filterResultsText(count) {
    return count === 0
      ? "No results"
      : `${count} result${count === 1 ? "" : "s"} available`;
  };

  /**
   * Specify a name attribute. A hidden input carries it with the code, since
   * the visible field holds the name, not the code.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Set an id for the field.
   * @type {string}
   */
  export let id = uniqueId();

  /**
   * Obtain a reference to the input element.
   * @bindable readonly
   * @type {null | HTMLInputElement}
   */
  export let ref = null;

  import { createEventDispatcher, onMount, tick } from "svelte";
  import ComboBox from "../ComboBox/ComboBox.svelte";
  import { createSearchFilter } from "../utils/intl-search.js";
  import { uniqueId } from "../utils/unique-id.js";
  import IntlPickerOption from "./IntlPickerOption.svelte";

  const dispatch = createEventDispatcher();

  let text = "";
  /** @type {string | undefined} */
  let selectedId = value ? source.resolve(value) : undefined;
  let prevValue = value;
  let prevSelectedId = selectedId;
  let prevSource = source;
  /**
   * The id `value` last set, which is not a choice the user made.
   * @type {string | undefined}
   */
  let silencedId;
  let warming = false;

  $: shouldFilterItem = createSearchFilter(() => source.ensure());
  $: comboProps = {
    ...$$restProps,
    id,
    items: source.items,
    shouldFilterItem,
    labelText,
    hideLabel,
    placeholder,
    helperText,
    invalid,
    invalidText,
    warn,
    warnText,
    disabled,
    readonly,
    required,
    size,
    direction,
    portalMenu,
    emptyText,
    filterResultsText,
    clearFilterOnOpen: true,
    autoHighlight: /** @type {const} */ ("first-match"),
  };

  // A change of `value` from outside moves the selection, and a change of the
  // selection from inside (a pick, the clear button, a form reset) moves
  // `value`. Each side remembers what it last saw so the two never chase each
  // other. They are functions so Svelte 3 and 4 do not order them as a cycle.
  $: syncSelection(value, source);
  $: syncValue(selectedId);

  /**
   * @param {string} nextValue
   * @param {typeof source} nextSource
   */
  function syncSelection(nextValue, nextSource) {
    if (nextValue === prevValue && nextSource === prevSource) return;
    const changedSource = nextSource !== prevSource;
    prevValue = nextValue;
    prevSource = nextSource;
    const nextId = nextValue ? nextSource.resolve(nextValue) : undefined;
    if (nextId !== selectedId) {
      silencedId = nextId;
      tick().then(() => (silencedId = undefined));
      selectedId = nextId;
      prevSelectedId = nextId;
    }
    if (changedSource && warming) warm();
    // The field holds the name of the old selection (or the old locale) until
    // it is next left, unless it is set here. An open menu belongs to the
    // user, who may be typing.
    if (!open) text = nextId ? labelOf(nextId) : "";
  }

  /**
   * @param {string | undefined} nextId
   */
  function syncValue(nextId) {
    if (nextId === prevSelectedId) return;
    prevSelectedId = nextId;
    const next = nextId ?? "";
    if ((value ? source.resolve(value) : "") !== next) {
      value = next;
      prevValue = next;
    }
  }

  /**
   * @param {string} id
   * @returns {string}
   */
  function labelOf(id) {
    return source.items.find((item) => item.id === id)?.text ?? "";
  }

  /**
   * @param {string} id
   */
  function describe(id) {
    return {
      ...source.detail(id),
      value: id,
      label: labelOf(id) || id,
      metadata: metadata ? metadata(id) : undefined,
    };
  }

  /**
   * @param {CustomEvent<{ selectedId: string }>} event
   */
  function handleSelect(event) {
    const id = event.detail.selectedId;
    if (id === silencedId) return;
    dispatch("change", describe(id));
  }

  function handleClear() {
    dispatch("change", { value: "", label: "", metadata: undefined });
    dispatch("clear");
  }

  /** @type {() => void} */
  let cancelWarm = () => {};

  // Search needs text for every item, and building it is the slow part. Do it
  // in slices while the browser is idle, from the first sign the user means
  // to open the menu.
  function warm() {
    cancelWarm();
    warming = true;
    if (typeof window === "undefined") return;
    const current = source;
    let cancelled = false;
    /** @type {number | undefined} */
    let handle;
    const run = (
      /** @type {{ timeRemaining?: () => number } | undefined} */ idle,
    ) => {
      if (cancelled || current !== source) return;
      const budget = Math.max(4, Math.min(idle?.timeRemaining?.() ?? 8, 8));
      if (!current.warm(performance.now() + budget)) queue();
    };
    const queue = () => {
      handle =
        typeof requestIdleCallback === "function"
          ? requestIdleCallback(run, { timeout: 250 })
          : /** @type {any} */ (setTimeout(run, 16));
    };
    cancelWarm = () => {
      cancelled = true;
      if (handle === undefined) return;
      if (typeof cancelIdleCallback === "function") cancelIdleCallback(handle);
      else clearTimeout(handle);
    };
    queue();
  }

  function handleIntent() {
    if (!warming) warm();
  }

  onMount(() => {
    if (detect && !value) {
      const guess = source.detect();
      if (guess) value = guess;
    }
    return () => cancelWarm();
  });
</script>

{#if name}
  <input type="hidden" {name} {value} {disabled} />
{/if}
<!-- A slot cannot sit inside an `{#if}`, so each branch renders the field
     whole. A label slot that is always present would add an empty label. -->
{#if $$slots.labelChildren}
  <ComboBox
    {...comboProps}
    bind:ref
    bind:open
    bind:value={text}
    bind:selectedId
    on:select={handleSelect}
    on:clear={handleClear}
    on:open
    on:open={handleIntent}
    on:close
    on:focus
    on:focus={handleIntent}
    on:blur
    on:keydown
    on:keyup
    on:paste
    let:item
  >
    <svelte:fragment slot="labelChildren">
      <slot name="labelChildren" />
    </svelte:fragment>
    <IntlPickerOption {kind} {source} {item} {locale} {flag} />
  </ComboBox>
{:else}
  <ComboBox
    {...comboProps}
    bind:ref
    bind:open
    bind:value={text}
    bind:selectedId
    on:select={handleSelect}
    on:clear={handleClear}
    on:open
    on:open={handleIntent}
    on:close
    on:focus
    on:focus={handleIntent}
    on:blur
    on:keydown
    on:keyup
    on:paste
    let:item
  >
    <IntlPickerOption {kind} {source} {item} {locale} {flag} />
  </ComboBox>
{/if}
