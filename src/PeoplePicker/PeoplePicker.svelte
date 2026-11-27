<script context="module">
  const SEPARATOR = /[,;]/;

  /**
   * @param {number} count
   * @returns {string}
   */
  function defaultResultsText(count) {
    return count === 1 ? "1 result available" : `${count} results available`;
  }

  /**
   * @param {number} count
   * @returns {string}
   */
  function defaultMembersText(count) {
    return count === 1 ? "1 member" : `${count} members`;
  }

  /**
   * What the live region says about the menu: the result count, or why there
   * is none.
   * @param {boolean} isOpen
   * @param {string} state
   * @param {number} count
   * @param {{ errorText: string, retryText: string, loadingText: string, emptyText: string, resultsText: (count: number) => string }} texts
   */
  function announcementFor(isOpen, state, count, texts) {
    if (!isOpen) return "";
    if (state === "error") return `${texts.errorText}. ${texts.retryText}`;
    if (state === "loading") return texts.loadingText;
    return count === 0 ? texts.emptyText : texts.resultsText(count);
  }
</script>

<script>
  /**
   * @typedef {object} Person
   * @property {string | number} id - Identifies the person. Combined with `type`, so a group and a user may share one.
   * @property {string} name - What the chip and the option show.
   * @property {string} [email] - The address. Also matched by a typed query, and used to catch a duplicate.
   * @property {string} [avatar] - Image URL. Without one the avatar shows initials, or a group glyph.
   * @property {string} [secondary] - Muted text beside the name, such as a job title. Also matched by a typed query.
   * @property {"user" | "group"} [type="user"] - A group is one chip, or expands to its members with `groups="expand"`.
   * @property {ReadonlyArray<Person>} [members] - The members of a group, used by `groups="expand"`.
   * @property {number} [memberCount] - The size of a group whose `members` are not loaded.
   * @property {boolean} [disabled] - Show the option but do not let it be chosen.
   * @property {boolean} [free] - Set on an entry the user typed or pasted instead of choosing.
   * @property {boolean} [invalid] - Set on a free entry that failed `validateEntry`.
   */

  /**
   * Passed to a function source with the query.
   * @typedef {object} PersonSourceContext
   * @property {AbortSignal} signal - Aborts when a newer query replaces this one, or the menu closes.
   */

  /**
   * @event {{ person: Person; source: "menu" | "enter" | "delimiter" | "paste" | "blur" | "group" }} add - Cancelable. Dispatched before a person is added; call `preventDefault()` to keep it out.
   * @event {{ person: Person; index: number }} remove - Cancelable. Dispatched before a person is removed; call `preventDefault()` to keep it.
   * @event {{ value: Person | string; reason: "duplicate" | "max" | "invalid" | "members" }} invalid - Dispatched when an entry is rejected, or a free entry is added invalid.
   * @event {Person[]} change - Dispatched after people are added or removed.
   * @event {{ error: unknown }} error - Dispatched when a function source or `loadMembers` fails.
   * @slot {{ person: Person; index: number; query: string; highlighted: boolean }} item - Replaces the content of an option.
   * @slot {{ person: Person; index: number; props: { filter: boolean; disabled: boolean; value: string; title: string; maxWidth: string; }; }} chip - Replaces a chip. Spread `props` onto a `Tag` to keep its close button wired to removal.
   * @restProps {input}
   */

  /**
   * Specify the people chosen.
   * Follows the field when the owning form resets.
   * @type {Person[]}
   * @bindable writable
   */
  export let value = [];

  /**
   * Where the people to choose from come from: an array, filtered here by
   * name, email and `secondary`, or a function that returns them for the
   * query, synchronously or as a promise. A function is debounced and gets
   * an `AbortSignal`; only the newest call may answer.
   * Replace the array or function to run the query again.
   * @type {ReadonlyArray<Person> | ((query: string, context: PersonSourceContext) => ReadonlyArray<Person> | Promise<ReadonlyArray<Person>>)}
   */
  export let items = [];

  /**
   * People to offer before anything is typed, such as recent or suggested
   * ones. Shown while the query is empty (or shorter than `minQueryLength`),
   * instead of calling a function source.
   * @type {ReadonlyArray<Person>}
   */
  export let suggestions = [];

  /**
   * Set to `false` to choose one person: choosing again replaces the
   * chip, and `value` holds at most one person.
   */
  export let multiple = true;

  /**
   * Set to `true` to let the user add an entry that is not in `items`: an
   * email address typed and confirmed with Enter, `,` or `;`, or pasted
   * (`a@x.com, b@y.com`, or `Ada <ada@x.com>`). An entry that fails
   * `validateEntry` becomes an invalid chip.
   */
  export let allowEmail = false;

  /**
   * Check a free entry before it is added. Return `true` to accept it, or
   * `false` (or a message) to mark its chip invalid. Defaults to accepting
   * an email address.
   * @type {(entry: { name: string; email?: string }) => boolean | string}
   */
  export let validateEntry = (entry) =>
    entry.email !== undefined && isEmail(entry.email);

  /**
   * What to do with a free entry that fails `validateEntry`: `"chip"` adds
   * it as an invalid chip, so the user sees what failed, and `"reject"`
   * keeps it in the text field with a message.
   * @type {"chip" | "reject"}
   */
  export let invalidEntries = "chip";

  /**
   * What choosing a group does: `"chip"` adds the group as one chip, which
   * is how an access list keeps following the group's membership, and
   * `"expand"` adds its members instead, from `members` or `loadMembers`.
   * @type {"chip" | "expand"}
   */
  export let groups = "chip";

  /**
   * Load the members of a group chosen with `groups="expand"`, when the
   * group has no `members`.
   * @type {((group: Person, context: PersonSourceContext) => ReadonlyArray<Person> | Promise<ReadonlyArray<Person>>) | undefined}
   */
  export let loadMembers = undefined;

  /**
   * Maximum number of people. Further ones are rejected with `maxText`.
   * @type {number | undefined}
   */
  export let max = undefined;

  /**
   * Show at most this many chips while the field has no focus, then a "+N"
   * chip for the rest. Focusing the field shows them all, wrapped. Set to
   * `0` to always show every chip.
   */
  export let maxVisible = 5;

  /** Characters to type before the menu searches. */
  export let minQueryLength = 0;

  /** Most options shown. */
  export let limit = 8;

  /**
   * Milliseconds to wait after typing before calling a function source.
   */
  export let debounce = 200;

  /**
   * Replaces the ranking of an array source.
   * @type {((items: ReadonlyArray<Person>, query: string) => ReadonlyArray<Person>) | undefined}
   */
  export let filter = undefined;

  /**
   * Set the size of the field. Chips and options scale with it.
   * Inherits the parent `Form` size when unset.
   * Also accepts Carbon v11's `"md"` (the 40px default, which overrides a
   * `Form` size) and `"lg"` (`"xl"`).
   * @type {"xs" | "sm" | "md" | "lg" | "xl" | undefined}
   */
  export let size = undefined;

  /** Specify the placeholder text */
  export let placeholder = "";

  /** Set to `true` to disable the field and its chips */
  export let disabled = false;

  /** Set to `true` to show the chips without letting users add or remove any */
  export let readonly = false;

  /** Set to `true` to require at least one person */
  export let required = false;

  /** Specify the label text */
  export let labelText = "";

  /** Set to `true` to visually hide the label text */
  export let hideLabel = false;

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

  /**
   * Set to `true` to add the typed text as a free entry when the field
   * loses focus. Applies with `allowEmail`.
   */
  export let addOnBlur = false;

  /**
   * Wait this many milliseconds before showing the loading row.
   * Once shown, it stays for at least 500 ms.
   */
  export let loadingDelay = 300;

  /**
   * Override the menu's max height. Numbers are pixels; strings accept any
   * CSS length. Defaults to 20rem, taller than the default eight options,
   * so the menu does not scroll.
   * @type {number | string | undefined}
   */
  export let menuMaxHeight = undefined;

  /** Specify the accessible name prefix of each chip's remove button */
  export let removeText = "Remove";

  /**
   * Specify the text of the row shown when nothing matches a query.
   * Set to `""` to show no row.
   */
  export let emptyText = "No results";

  /** Specify the text of the loading row */
  export let loadingText = "Loading...";

  /** Specify the text of the row shown when a source fails */
  export let errorText = "Could not load results";

  /** Specify the text of the retry button in the error row */
  export let retryText = "Try again";

  /**
   * Specify the row shown while the query is shorter than `minQueryLength`
   * and there are no `suggestions`. Set to `""` to show no row.
   * @type {(count: number) => string}
   */
  export let minQueryText = (count) =>
    `Type ${count} or more characters to search`;

  /** Specify the heading above `suggestions` */
  export let suggestionsText = "Suggested";

  /**
   * Specify the text of the option that adds a typed address.
   * @type {(text: string) => string}
   */
  export let addEntryText = (text) => `Add ${text}`;

  /**
   * Specify the muted text of a group whose size is known.
   * @type {(count: number) => string}
   */
  export let membersText = defaultMembersText;

  /**
   * Specify the text announced to screen readers when results arrive.
   * @type {(count: number) => string}
   */
  export let resultsText = defaultResultsText;

  /** Specify the message shown when a duplicate is rejected */
  export let duplicateText = "This person has already been added";

  /** Specify the message shown when a person is rejected at `max` */
  export let maxText = "You've reached the maximum number of people";

  /** Specify the message shown when a free entry is rejected */
  export let invalidEntryText = "Enter a valid email address";

  /**
   * Specify the message shown while the field holds invalid chips.
   * @type {(count: number) => string}
   */
  export let invalidChipsText = (count) =>
    count === 1
      ? "1 entry isn't valid. Remove it to continue."
      : `${count} entries aren't valid. Remove them to continue.`;

  /** Specify the accessible name suffix of an invalid chip */
  export let invalidChipLabel = "not a valid email address";

  /** Specify the message shown when `loadMembers` fails */
  export let membersErrorText = "Could not load the members of this group";

  /**
   * Specify the validation message shown when `required` blocks a form
   * that has text in the field but nobody added yet.
   */
  export let requiredText = "Add at least one person";

  /**
   * Specify the accessible name of the "+N" chip.
   * @type {(count: number) => string}
   */
  export let overflowLabel = (count) => `Show ${count} more`;

  /** Specify the visually hidden keyboard instructions read with the field */
  export let instructionsText =
    "Type to search. Use the up and down arrow keys to choose a result and Enter to add it. Press Backspace in an empty field to move to the people added, then Delete to remove one.";

  /**
   * Announcement after people are added.
   * @type {(people: Person[], count: number) => string}
   */
  export let addedText = (people, count) =>
    `${people.length === 1 ? people[0].name : `${people.length} people`} added. ${count} ${count === 1 ? "person" : "people"}.`;

  /**
   * Announcement after a person is removed.
   * @type {(person: Person, count: number) => string}
   */
  export let removedText = (person, count) =>
    `${person.name} removed. ${count} ${count === 1 ? "person" : "people"}.`;

  /** Set an id for the text input */
  export let id = uniqueId();

  /**
   * Specify a name to submit each person as a hidden input with the form:
   * the `id`, or the address of a free entry. Invalid entries are not
   * submitted.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Obtain a reference to the text input element.
   * @bindable readonly
   * @type {null | HTMLInputElement}
   */
  export let ref = null;

  /**
   * Obtain a reference to the menu HTML element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let menuRef = null;

  import { createEventDispatcher, getContext, onMount, tick } from "svelte";
  import ListBoxMenu from "../ListBox/ListBoxMenu.svelte";
  import ListBoxMenuItem from "../ListBox/ListBoxMenuItem.svelte";
  import ListBoxMenuStatus from "../ListBox/ListBoxMenuStatus.svelte";
  import { createStatusAnnouncer } from "../ListBox/menu-status.js";
  import FloatingPortal from "../Portal/FloatingPortal.svelte";
  import Tag from "../Tag/Tag.svelte";
  import TagSet from "../TagSet/TagSet.svelte";
  import UserAvatar from "../UserAvatar/UserAvatar.svelte";
  import { FORM_SIZE_CONTEXT_KEY } from "../constants/context-keys.js";
  import EditOff from "../icons/EditOff.svelte";
  import UserMultiple from "../icons/UserMultiple.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import { toCssLength } from "../utils/css-length.js";
  import { debounce as debounced } from "../utils/debounce.js";
  import { createLoadingIndicator } from "../utils/delayed-loading.js";
  import {
    buildFieldIds,
    joinDescribedBy,
    resolveStatusDescribedBy,
    resolveValidationVisibility,
  } from "../utils/field-status.js";
  import { fieldsetDisabled } from "../utils/fieldset-disabled.js";
  import { formReset } from "../utils/form-reset.js";
  import { isImeComposition } from "../utils/ime-composition.js";
  import {
    getLayoutDirection,
    resolveLayoutDirection,
  } from "../utils/layout-direction.js";
  import { moveIndex } from "../utils/move-index.js";
  import { FIELD_SIZE_ALIASES, normalizeSize } from "../utils/size-aliases.js";
  import { uniqueId } from "../utils/unique-id.js";
  import {
    addPeople,
    createEntry,
    isEmail,
    isList,
    parseEntry,
    personKey,
    splitEntries,
  } from "./people.js";
  import { createPersonSource } from "./person-source.js";

  // A disabled `<fieldset>` around the component disables it too.
  let inDisabledFieldset = false;
  $: effectiveDisabled = disabled || inDisabledFieldset;

  const dispatch = createEventDispatcher();

  /** @type {undefined | import("svelte/store").Readable<undefined | "xs" | "sm" | "md" | "xl">} */
  const formSize = getContext(FORM_SIZE_CONTEXT_KEY);
  const layoutDirection = getLayoutDirection();
  $: effectiveSize = normalizeSize(size ?? $formSize, FIELD_SIZE_ALIASES);
  /** @type {"xs" | "sm" | "lg" | "default"} */
  $: tagSize =
    effectiveSize === "xs" || effectiveSize === "sm"
      ? effectiveSize
      : effectiveSize === "xl"
        ? "lg"
        : "default";
  /** The size of an option, which is also the size of its avatar's row. */
  $: optionSize =
    effectiveSize === "xs" || effectiveSize === "sm"
      ? "sm"
      : effectiveSize === "xl"
        ? "lg"
        : "md";

  // Restored when the owning form resets.
  const initialValue = value.slice();

  /** @type {null | HTMLDivElement} */
  let rootRef = null;
  /** @type {null | HTMLDivElement} */
  let fieldRef = null;
  let draft = "";
  let focused = false;
  let focusWithin = false;
  let composing = false;
  /** Whether the user asked for the menu since it last closed. */
  let menuWanted = false;
  let highlightedIndex = -1;
  let keyboardHighlight = true;
  let showLoading = false;
  /** Text of the visually hidden live region for additions and removals. */
  let statusText = "";
  /** Text of the visually hidden live region for the menu. */
  let announcement = "";
  // Clears the region before each message, so a repeat is announced too.
  const announceStatus = createStatusAnnouncer((text) => (statusText = text));
  /** Message for the most recent rejected entry; cleared on the next edit. */
  let rejectionText = "";
  /** @type {import("./person-source.js").PersonSourceState<Person>} */
  let sourceState = { status: "idle", items: [], query: "" };
  /** The members of a group are loading. */
  let expanding = false;
  /** @type {AbortController | undefined} */
  let membersController;
  let membersSeq = 0;
  /**
   * What the last request was for, so a repeated state asks nothing.
   * @type {null | { query: string; items: unknown; filter: unknown; signature: string; limit: number; debounce: number }}
   */
  let requested = null;

  const source = createPersonSource((state) => {
    sourceState = state;
  });

  const loadingIndicator = createLoadingIndicator((shown) => {
    showLoading = shown;
  });

  const announce = debounced(
    /** @param {unknown} text */ (text) => {
      announcement = String(text);
    },
    300,
  );

  $: interactive = !effectiveDisabled && !readonly;
  $: invalidCount = value.filter((person) => person.invalid).length;
  $: ({ showInvalid, showWarn } = resolveValidationVisibility({
    invalid: invalid || !!rejectionText || invalidCount > 0,
    warn,
    disabled: effectiveDisabled,
    readonly,
  }));
  $: fieldErrorText = invalid
    ? invalidText
    : rejectionText || (invalidCount > 0 ? invalidChipsText(invalidCount) : "");
  $: ({ helperId, errorId, warnId } = buildFieldIds(id));
  $: instructionsId = `instructions-${id}`;
  $: menuId = `menu-${id}`;

  // `required` alone is satisfied by text that isn't a person yet, and that
  // text isn't submitted. Invalid chips block a submit too.
  $: ref?.setCustomValidity(
    invalidCount > 0
      ? invalidChipsText(invalidCount)
      : required && value.length === 0 && draft !== ""
        ? requiredText
        : "",
  );

  // Who is chosen already, so the menu skips them.
  $: chosenKeys = new Set(value.map(personKey));
  $: chosenEmails = new Set(
    value.flatMap((person) =>
      person.email && (person.type ?? "user") === "user"
        ? [person.email.toLowerCase()]
        : [],
    ),
  );
  $: signature = value.map(personKey).join("\n");

  /**
   * Whether a person is chosen already, so the menu skips them. Reassigned
   * with the people, so what reads it runs again.
   * @type {(person: Person) => boolean}
   */
  $: isChosen = (person) =>
    multiple &&
    (chosenKeys.has(personKey(person)) ||
      (!!person.email &&
        (person.type ?? "user") === "user" &&
        chosenEmails.has(person.email.toLowerCase())));

  $: query = draft.trim();
  /**
   * `"suggest"` shows `suggestions`, `"hint"` asks for more characters, and
   * `"search"` asks `items`.
   * @type {"suggest" | "hint" | "search"}
   */
  $: mode =
    query === "" && suggestions.length > 0
      ? "suggest"
      : query.length < minQueryLength
        ? "hint"
        : "search";
  $: listening =
    menuWanted && focused && interactive && !composing && !expanding;
  // Before anything that reads `sourceState`: the request writes it, and a
  // reactive statement does not run again for a write that a call makes.
  $: if (listening && mode === "search") {
    ensureRequest(query, items, filter, signature, limit, debounce);
  } else {
    stopRequests();
  }

  $: status = mode === "search" ? sourceState.status : "ready";
  $: suggestionRows =
    mode === "suggest"
      ? suggestions.filter((person) => !isChosen(person)).slice(0, limit)
      : [];
  $: results = mode === "search" ? sourceState.items : suggestionRows;
  $: queryEmail = query.toLowerCase();
  // The typed address as an option of its own, unless it names someone listed.
  $: entryRow =
    allowEmail &&
    mode === "search" &&
    isEmail(query) &&
    !chosenEmails.has(queryEmail) &&
    !results.some((person) => person.email?.toLowerCase() === queryEmail)
      ? createEntry(query, validateEntry)
      : null;
  $: rows = entryRow ? [entryRow, ...results] : results;
  $: showEmpty =
    !!emptyText &&
    mode === "search" &&
    status === "ready" &&
    rows.length === 0 &&
    query !== "";
  $: showHint = mode === "hint" && !!minQueryText(minQueryLength);
  $: showError = status === "error";
  $: open =
    listening &&
    (rows.length > 0 ||
      showEmpty ||
      showHint ||
      showError ||
      (status === "loading" && showLoading));
  $: highlightedId =
    open && highlightedIndex > -1 ? `${id}-option-${highlightedIndex}` : null;
  $: maxHeight = toCssLength(menuMaxHeight) ?? "20rem";
  $: loadingIndicator(status === "loading", loadingDelay);

  // A new list resets the highlight to its first option.
  $: {
    highlightedIndex = rows.findIndex((person) => !person.disabled);
    keyboardHighlight = true;
  }

  $: announce(
    announcementFor(
      open,
      showHint ? "ready" : status,
      rows.length,
      showHint
        ? {
            errorText,
            retryText,
            loadingText,
            emptyText: minQueryText(minQueryLength),
            resultsText,
          }
        : { errorText, retryText, loadingText, emptyText, resultsText },
    ),
  );

  /**
   * @param {string} text
   * @param {unknown} list
   * @param {unknown} rank
   * @param {string} chosen
   * @param {number} max
   * @param {number} wait
   */
  function ensureRequest(text, list, rank, chosen, max, wait) {
    if (
      requested &&
      requested.query === text &&
      requested.items === list &&
      requested.filter === rank &&
      requested.signature === chosen &&
      requested.limit === max &&
      requested.debounce === wait
    ) {
      return;
    }
    requested = {
      query: text,
      items: list,
      filter: rank,
      signature: chosen,
      limit: max,
      debounce: wait,
    };
    source.request(
      {
        items: /** @type {any} */ (list),
        limit: max,
        debounce: wait,
        exclude: isChosen,
        filter: /** @type {any} */ (rank),
      },
      text,
    );
  }

  function stopRequests() {
    if (!requested) return;
    requested = null;
    source.reset();
    sourceState = { status: "idle", items: [], query: "" };
  }

  onMount(() => () => {
    source.reset();
    loadingIndicator.cancel();
    announce.cancel();
    membersController?.abort();
  });

  /** @param {unknown} error */
  function reportError(error) {
    dispatch("error", { error });
  }

  $: if (sourceState.status === "error") reportError(sourceState.error);

  /**
   * @param {"duplicate" | "max" | "invalid" | "members"} reason
   * @param {Person | string} entry
   */
  function reject(reason, entry) {
    rejectionText =
      reason === "duplicate"
        ? duplicateText
        : reason === "max"
          ? maxText
          : reason === "members"
            ? membersErrorText
            : invalidEntryText;
    dispatch("invalid", { value: entry, reason });
  }

  /**
   * Run people through the duplicate and `max` checks and the cancelable
   * `add` event, then add the accepted ones in one assignment. Returns the
   * people to put back in the text field: those turned away by `max`, the
   * cancelled `add` event or `invalidEntries="reject"`. A duplicate is
   * reported and dropped, since the person is there already.
   *
   * @param {Person[]} people
   * @param {"menu" | "enter" | "delimiter" | "paste" | "blur" | "group"} origin
   * @returns {Person[]}
   */
  function add(people, origin) {
    /** @type {Person[]} */
    const rejected = [];
    /** @type {Person[]} */
    const candidates = [];

    for (const person of people) {
      if (person.invalid && invalidEntries === "reject") {
        reject("invalid", person);
        rejected.push(person);
      } else {
        candidates.push(person);
      }
    }

    const result = addPeople(value, candidates, { max, multiple });
    for (const { person, reason } of result.rejected) {
      reject(reason, person);
      if (reason !== "duplicate") rejected.push(person);
    }

    const accepted = result.added.filter((person) => {
      if (dispatch("add", { person, source: origin }, { cancelable: true })) {
        return true;
      }
      rejected.push(person);
      return false;
    });

    if (accepted.length > 0) {
      value = multiple
        ? addPeople(value, accepted, { max, multiple }).next
        : [accepted[accepted.length - 1]];
      announceStatus(addedText(accepted, value.length));
      dispatch("change", value);
      for (const person of accepted) {
        if (person.invalid)
          dispatch("invalid", { value: person, reason: "invalid" });
      }
    }

    return rejected;
  }

  /**
   * Set the text input's value, writing the DOM too. Not `bind:value`:
   * Svelte 3 and 4 run its listener after `on:input`, which would undo a
   * value set while splitting typed text.
   * @param {string} next
   */
  function setDraft(next) {
    draft = next;
    if (ref && ref.value !== next) ref.value = next;
  }

  /**
   * Add the person of a menu row, or expand a group.
   * @param {Person} person
   */
  async function choose(person) {
    if (person.disabled || !interactive) return;
    const fromSuggestions = query === "";

    if (person.type === "group" && groups === "expand") {
      await expand(person);
      return;
    }

    add([person], "menu");
    afterPick(fromSuggestions);
  }

  /** @param {boolean} keepOpen */
  function afterPick(keepOpen) {
    setDraft("");
    // Picking from the suggestions leaves them open for the next pick.
    menuWanted = keepOpen && multiple;
    requested = null;
  }

  /** @param {Person} group */
  async function expand(group) {
    let members = group.members;
    const seq = ++membersSeq;

    if (!members && loadMembers) {
      membersController?.abort();
      membersController =
        typeof AbortController === "undefined"
          ? undefined
          : new AbortController();
      const signal =
        membersController?.signal ??
        /** @type {AbortSignal} */ ({ aborted: false });
      expanding = true;
      announceStatus(loadingText);
      try {
        members = await loadMembers(group, { signal });
      } catch (error) {
        if (seq === membersSeq) {
          reject("members", group);
          reportError(error);
        }
        return;
      } finally {
        if (seq === membersSeq) expanding = false;
      }
      if (seq !== membersSeq || signal.aborted) return;
    }

    // A group that cannot say who is in it stays one chip.
    const people = (members ?? []).filter((person) => person.type !== "group");
    add(people.length > 0 ? [...people] : [group], "group");
    afterPick(false);
  }

  /**
   * Add what is in the text field as a free entry.
   * @param {"enter" | "delimiter" | "blur"} origin
   */
  function commitDraft(origin) {
    if (!allowEmail || !query) return;
    const rejected = add([createEntry(query, validateEntry)], origin);
    setDraft(rejected.length > 0 ? draft : "");
    menuWanted = false;
  }

  /** @param {{ detail: { index: number } }} event */
  function handleTagClose({ detail }) {
    if (!interactive) return;
    const { index } = detail;
    const person = value[index];
    if (person === undefined) return;
    if (!dispatch("remove", { person, index }, { cancelable: true })) return;

    const hadFocus = rootRef?.contains(document.activeElement);
    value = value.filter((_, i) => i !== index);
    rejectionText = "";
    announceStatus(removedText(person, value.length));
    dispatch("change", value);

    // With no chip left to take focus, keep it in the field. `TagSet` moves
    // focus to a neighbouring chip otherwise.
    if (hadFocus && value.length === 0) tick().then(() => ref?.focus());
  }

  /** @type {(index: number) => void} */
  function focusTag(index) {
    const buttons = rootRef?.querySelectorAll(
      ".bx--tag__close-icon:not(:disabled)",
    );
    if (!buttons?.length) return;
    /** @type {HTMLElement} */ (
      buttons[index < 0 ? buttons.length + index : index]
    )?.focus();
  }

  /**
   * The arrow key that points to the chips, at the field's inline start:
   * ArrowLeft, or ArrowRight under `dir="rtl"`. Read when the key arrives.
   * @param {string} key
   */
  function pointsToTags(key) {
    if (key !== "ArrowLeft" && key !== "ArrowRight") return false;
    const rtl = resolveLayoutDirection($layoutDirection, ref) === "rtl";
    return key === (rtl ? "ArrowRight" : "ArrowLeft");
  }

  /** @param {number} step */
  function highlight(step) {
    let next = highlightedIndex;
    for (let n = 0; n < rows.length; n++) {
      next = moveIndex(next, step, rows.length);
      if (!rows[next].disabled) break;
    }
    keyboardHighlight = true;
    highlightedIndex = next;
  }

  /** @param {KeyboardEvent} event */
  function handleInputKeydown(event) {
    // Enter that commits an IME composition is not an add.
    if (composing || isImeComposition(event) || !interactive) return;

    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        if (!open) {
          menuWanted = true;
          event.preventDefault();
          return;
        }
        if (!rows.some((person) => !person.disabled)) return;
        event.preventDefault();
        highlight(event.key === "ArrowDown" ? 1 : -1);
        return;
      }
      case "Enter": {
        if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
          return;
        }
        if (open && highlightedIndex > -1 && rows[highlightedIndex]) {
          event.preventDefault();
          choose(rows[highlightedIndex]);
          return;
        }
        if (open && showError) {
          event.preventDefault();
          source.retry();
          return;
        }
        if (query) {
          // Typed text is not a submit.
          event.preventDefault();
          commitDraft("enter");
        }
        return;
      }
      case "Escape": {
        if (open) {
          event.preventDefault();
          event.stopPropagation();
          menuWanted = false;
        } else if (draft !== "") {
          event.preventDefault();
          event.stopPropagation();
          setDraft("");
        }
        return;
      }
      case "Tab": {
        menuWanted = false;
        return;
      }
    }

    const atStart =
      ref?.selectionStart === 0 && ref?.selectionEnd === 0 && value.length > 0;

    // A held Backspace that just emptied the field must not run on into the
    // chips: only a fresh press moves there.
    if (event.key === "Backspace" && atStart && !event.repeat) {
      event.preventDefault();
      menuWanted = false;
      focusTag(-1);
    } else if (atStart && pointsToTags(event.key)) {
      event.preventDefault();
      menuWanted = false;
      focusTag(-1);
    }
  }

  /**
   * Keys on a focused chip that hand focus back to the text input.
   * @param {KeyboardEvent} event
   */
  function handleTagKeydown(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.matches(".bx--tag__close-icon")) return;

    const buttons = Array.from(
      rootRef?.querySelectorAll(".bx--tag__close-icon:not(:disabled)") ?? [],
    );
    const isLast = buttons[buttons.length - 1] === target;

    if (
      event.key === "Escape" ||
      event.key === "End" ||
      (isLast &&
        (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
        !pointsToTags(event.key))
    ) {
      event.preventDefault();
      ref?.focus();
    }
  }

  /** @param {InputEvent & { currentTarget: HTMLInputElement }} event */
  function handleInput(event) {
    draft = event.currentTarget.value;
    rejectionText = "";
    menuWanted = true;
    // An IME's text isn't final until the composition ends, which
    // `handleCompositionEnd` splits.
    if (event.isComposing) return;
    splitDraft();
  }

  function handleCompositionStart() {
    composing = true;
  }

  /** @param {CompositionEvent & { currentTarget: HTMLInputElement }} event */
  function handleCompositionEnd(event) {
    composing = false;
    draft = event.currentTarget.value;
    splitDraft();
  }

  /** Add the text before the last `,` or `;` as free entries. */
  function splitDraft() {
    if (!interactive || !allowEmail || !SEPARATOR.test(draft)) return;
    const parts = draft.split(SEPARATOR);
    // Everything before the last separator is complete; the rest is still
    // being typed.
    const rest = parts.pop() ?? "";
    const entries = parts.map((part) => part.trim()).filter(Boolean);
    const rejected = add(
      entries.map((entry) => createEntry(entry, validateEntry)),
      "delimiter",
    );
    setDraft(rejected.map((person) => person.name).join(", ") + rest);
  }

  /**
   * Known people by address, for resolving a pasted list.
   * @returns {Map<string, Person>}
   */
  function knownByEmail() {
    /** @type {Map<string, Person>} */
    const known = new Map();
    for (const list of [
      suggestions,
      typeof items === "function" ? [] : items,
    ]) {
      for (const person of list) {
        if (person.email && (person.type ?? "user") === "user") {
          const key = person.email.toLowerCase();
          if (!known.has(key)) known.set(key, person);
        }
      }
    }
    return known;
  }

  /** @param {ClipboardEvent} event */
  function handlePaste(event) {
    if (!interactive || !ref) return;
    const text = event.clipboardData?.getData("text") ?? "";
    if (!isList(text)) return;

    const start = ref.selectionStart ?? draft.length;
    const end = ref.selectionEnd ?? draft.length;
    const combined = draft.slice(0, start) + text + draft.slice(end);
    const entries = splitEntries(combined);
    const known = knownByEmail();

    /** @type {Person[]} */
    const people = [];
    /** @type {string[]} */
    const left = [];
    for (const entry of entries) {
      const { email } = parseEntry(entry);
      const match = email ? known.get(email.toLowerCase()) : undefined;
      if (match) people.push(match);
      else if (allowEmail) people.push(createEntry(entry, validateEntry));
      else left.push(entry);
    }

    // Without free entries, a list of names has nowhere to go but the field.
    if (people.length === 0) return;

    event.preventDefault();
    const rejected = add(people, "paste");
    setDraft(
      [...left, ...rejected.map((person) => person.email ?? person.name)].join(
        ", ",
      ),
    );
    menuWanted = false;
  }

  function handleFocus() {
    focused = true;
  }

  function handleBlur() {
    focused = false;
    menuWanted = false;
    if (addOnBlur && interactive) commitDraft("blur");
  }

  function handleFocusin() {
    focusWithin = true;
  }

  /** @param {FocusEvent} event */
  function handleFocusout(event) {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !rootRef?.contains(next)) {
      focusWithin = false;
    }
  }

  /**
   * Clicking the field's empty space focuses the text input and opens the
   * menu.
   * @param {MouseEvent} event
   */
  function handleFieldClick(event) {
    if (!interactive) return;
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      target.closest(".bx--tag") &&
      !target.closest("[data-more]")
    ) {
      return;
    }
    ref?.focus();
    menuWanted = true;
  }

  /**
   * Put the full text in a `title` while an option is cut short, so hovering
   * it shows what the ellipsis hides.
   * @param {HTMLElement} row
   */
  function titleWhenCut(row) {
    const cut = [row, ...row.querySelectorAll("*")].some(
      (node) => node.scrollWidth > node.clientWidth,
    );
    if (cut) row.setAttribute("title", row.textContent?.trim() ?? "");
    else row.removeAttribute("title");
  }

  /**
   * @param {number} index
   * @param {MouseEvent} event
   */
  function handleOptionEnter(index, event) {
    if (event.currentTarget instanceof HTMLElement) {
      titleWhenCut(event.currentTarget);
    }
    if (highlightedIndex === index) return;
    keyboardHighlight = false;
    highlightedIndex = index;
  }

  /**
   * Props for each chip, passed to the `chip` slot. Spreading them onto any
   * tag keeps its close button wired to removal.
   * @param {Person} person
   */
  function chipSlotProps(person) {
    return {
      filter: !readonly,
      disabled: effectiveDisabled,
      value: personKey(person),
      title: removeText,
      maxWidth: "13rem",
    };
  }

  /** @param {Person} person */
  function detailOf(person) {
    if (person.type === "group" && person.memberCount !== undefined) {
      return membersText(person.memberCount);
    }
    return [person.email, person.secondary].filter(Boolean).join(" · ");
  }

  /** @param {Person} person */
  function submitted(person) {
    return person.free && person.email ? person.email : String(person.id);
  }

  function handleFormReset() {
    value = initialValue.slice();
    setDraft("");
    rejectionText = "";
    menuWanted = false;
  }

  $: collapsed = maxVisible > 0 && value.length > maxVisible && !focusWithin;
  $: shown = collapsed ? value.slice(0, maxVisible) : value;
  $: hiddenCount = value.length - shown.length;
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  use:fieldsetDisabled={(value) => (inDisabledFieldset = value)}
  bind:this={rootRef}
  class:bx--form-item={true}
  class:bx--people-picker={true}
  on:keydown={handleTagKeydown}
  on:focusin={handleFocusin}
  on:focusout={handleFocusout}
>
  {#if labelText || $$slots.labelChildren}
    <label
      for={id}
      class:bx--label={true}
      class:bx--visually-hidden={hideLabel}
      class:bx--label--disabled={effectiveDisabled}
    >
      <slot name="labelChildren">{labelText}</slot>
    </label>
  {/if}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    bind:this={fieldRef}
    data-invalid={showInvalid || undefined}
    data-warn={showWarn || undefined}
    class:bx--tag-input={true}
    class:bx--tag-input--xs={effectiveSize === "xs"}
    class:bx--tag-input--sm={effectiveSize === "sm"}
    class:bx--tag-input--xl={effectiveSize === "xl"}
    class:bx--tag-input--focused={focused}
    class:bx--tag-input--invalid={showInvalid}
    class:bx--tag-input--disabled={effectiveDisabled}
    class:bx--tag-input--readonly={readonly}
    class:bx--tag-input--status={readonly || showInvalid || showWarn}
    on:click={handleFieldClick}
  >
    {#if readonly}
      <EditOff class="bx--text-input__readonly-icon" />
    {:else if showInvalid}
      <WarningFilled class="bx--text-input__invalid-icon" />
    {:else if showWarn}
      <WarningAltFilled
        class="bx--text-input__invalid-icon bx--text-input__invalid-icon--warning"
      />
    {/if}
    <TagSet
      id="{id}-tags"
      class="bx--tag-input__tags"
      navigation="roving"
      multiline
      size={tagSize}
      on:close:tag={handleTagClose}
    >
      {#each shown as person, index (index)}
        {@const props = chipSlotProps(person)}
        <slot name="chip" {person} {index} {props}>
          <Tag {...props} type={person.invalid ? "red" : undefined}>
            <svelte:fragment slot="icon">
              {#if person.invalid}
                <WarningFilled />
              {:else}
                <UserAvatar
                  size="sm"
                  name={person.name}
                  image={person.avatar}
                  imageDescription=""
                  backgroundColor="auto"
                  icon={person.type === "group" ? UserMultiple : undefined}
                />
              {/if}
            </svelte:fragment>
            {person.name}
            {#if person.invalid}
              <span class:bx--visually-hidden={true}>, {invalidChipLabel}</span>
            {/if}
          </Tag>
        </slot>
      {/each}
      {#if hiddenCount > 0}
        <Tag
          interactive={interactive || readonly}
          disabled={effectiveDisabled}
          aria-label={overflowLabel(hiddenCount)}
          data-more="true"
          on:click={() => ref?.focus()}>+{hiddenCount}</Tag
        >
      {/if}
      <input
        bind:this={ref}
        value={draft}
        use:formReset={handleFormReset}
        type="text"
        autocomplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded={open ? "true" : "false"}
        aria-controls={open ? menuId : undefined}
        aria-activedescendant={highlightedId ?? undefined}
        aria-invalid={showInvalid ? "true" : undefined}
        aria-errormessage={showInvalid && fieldErrorText ? errorId : undefined}
        disabled={effectiveDisabled}
        {id}
        placeholder={(readonly && value.length > 0) ||
        (!multiple && value.length > 0)
          ? undefined
          : placeholder}
        {readonly}
        required={required && value.length === 0}
        class:bx--tag-input__input={true}
        {...$$restProps}
        aria-describedby={joinDescribedBy(
          interactive && instructionsId,
          resolveStatusDescribedBy({
            showInvalid,
            showWarn,
            invalidText: fieldErrorText,
            warnText,
            helperText,
            errorId: errorId ?? "",
            warnId: warnId ?? "",
            helperId: helperId ?? "",
            includeErrorId: false,
          }),
          $$restProps["aria-describedby"],
        )}
        on:input={handleInput}
        on:compositionstart={handleCompositionStart}
        on:compositionend={handleCompositionEnd}
        on:keydown={handleInputKeydown}
        on:keydown
        on:paste={handlePaste}
        on:focus={handleFocus}
        on:focus
        on:blur={handleBlur}
        on:blur
      />
    </TagSet>
  </div>
  {#if !showInvalid && !showWarn && helperText}
    <div
      id={helperId}
      class:bx--form__helper-text={true}
      class:bx--form__helper-text--disabled={effectiveDisabled}
    >
      {helperText}
    </div>
  {/if}
  {#if showInvalid && fieldErrorText}
    <div class:bx--form-requirement={true} id={errorId} role="alert">
      {fieldErrorText}
    </div>
  {/if}
  {#if showWarn && warnText}
    <div class:bx--form-requirement={true} id={warnId}>{warnText}</div>
  {/if}
  {#if name}
    {#each value as person, index (index)}
      {#if !person.invalid}
        <input
          type="hidden"
          {name}
          value={submitted(person)}
          disabled={effectiveDisabled}
        />
      {/if}
    {/each}
  {/if}
  <span id={instructionsId} class:bx--visually-hidden={true}
    >{instructionsText}</span
  >
  <!-- Always rendered (even while empty) so assistive tech registers the
       regions before their text changes. -->
  <span role="status" aria-live="polite" class:bx--visually-hidden={true}
    >{statusText}</span
  >
  <span aria-live="polite" aria-atomic="true" class:bx--visually-hidden={true}
    >{announcement}</span
  >
</div>
{#if fieldRef}
  <FloatingPortal
    anchor={fieldRef}
    {open}
    direction="bottom"
    gapTop={4}
    gapBottom={4}
  >
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class:bx--people-picker__menu={true}
      class:bx--people-picker__menu--md={optionSize === "md"}
      class:bx--people-picker__menu--lg={optionSize === "lg"}
      on:mousedown|preventDefault
    >
      {#if mode === "suggest" && rows.length > 0 && suggestionsText}
        <div class:bx--people-picker__heading={true} aria-hidden="true">
          {suggestionsText}
        </div>
      {/if}
      <ListBoxMenu
        {id}
        aria-label={mode === "suggest"
          ? suggestionsText
          : labelText || "People"}
        tabindex={-1}
        aria-busy={status === "loading" ? "true" : undefined}
        {highlightedId}
        highlightScroll={keyboardHighlight}
        bind:ref={menuRef}
        style="position: static; max-height: {maxHeight};"
      >
        {#each rows as person, index (index)}
          <ListBoxMenuItem
            id="{id}-option-{index}"
            disabled={person.disabled}
            on:click={() => choose(person)}
            on:mouseenter={(event) => handleOptionEnter(index, event)}
          >
            <slot
              name="item"
              {person}
              {index}
              {query}
              highlighted={index === highlightedIndex}
            >
              <UserAvatar
                size={optionSize === "lg" ? "md" : "sm"}
                name={person.name}
                image={person.avatar}
                imageDescription=""
                backgroundColor="auto"
                icon={person.type === "group" ? UserMultiple : undefined}
              />
              <span class:bx--people-picker__text={true}>
                <span class:bx--people-picker__name={true}
                  >{person === entryRow
                    ? addEntryText(person.email ?? person.name)
                    : person.name}</span
                >
                {#if person !== entryRow && detailOf(person)}
                  <span class:bx--people-picker__secondary={true}
                    >{detailOf(person)}</span
                  >
                {/if}
              </span>
            </slot>
          </ListBoxMenuItem>
        {/each}
        {#if status === "loading" && showLoading}
          <ListBoxMenuStatus>{loadingText}</ListBoxMenuStatus>
        {:else if showEmpty}
          <ListBoxMenuStatus>{emptyText}</ListBoxMenuStatus>
        {:else if showHint}
          <ListBoxMenuStatus>{minQueryText(minQueryLength)}</ListBoxMenuStatus>
        {/if}
      </ListBoxMenu>
      {#if showError}
        <!-- Not an option, so outside the listbox. Keyboard users retry
             with Enter, which the live region says. -->
        <div class:bx--people-picker__error={true} aria-hidden="true">
          <span>{errorText}</span>
          <button
            type="button"
            tabindex="-1"
            class:bx--people-picker__retry={true}
            on:click={() => source.retry()}>{retryText}</button
          >
        </div>
      {/if}
    </div>
  </FloatingPortal>
{/if}
