<script>
  import { Stack, TokenSearch } from "carbon-components-svelte";

  const people = [
    "alice",
    "alina",
    "bob",
    "carol",
    "dmitri",
    "elena",
    "fatima",
    "giovanni",
  ].map((name) => ({
    value: name,
    label: `${name[0].toUpperCase()}${name.slice(1)} Example`,
    description: `@${name}`,
  }));

  /**
   * Knobs the tests turn: how long the user search takes and whether it
   * fails. `calls` and `aborted` record what the component asked for.
   */
  const control = {
    delay: (/** @type {string} */ _query) => 0,
    fail: (/** @type {string} */ _query) => false,
    ignoreAbort: false,
    calls: /** @type {string[]} */ ([]),
    aborted: /** @type {string[]} */ ([]),
  };
  if (typeof window !== "undefined") {
    /** @type {any} */ (window).__tokenSearch = control;
  }

  function searchUsers(
    /** @type {string} */ query,
    /** @type {{ signal: AbortSignal }} */ { signal },
  ) {
    control.calls.push(query);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (control.fail(query)) reject(new Error("offline"));
        else {
          resolve(people.filter((person) => person.value.includes(query)));
        }
      }, control.delay(query));
      if (!control.ignoreAbort) {
        signal.addEventListener("abort", () => {
          control.aborted.push(query);
          clearTimeout(timer);
          reject(new DOMException("Aborted", "AbortError"));
        });
      }
    });
  }

  const keys = [
    {
      key: "is",
      label: "State",
      type: "enum",
      values: [
        { value: "open", description: "Not yet closed" },
        { value: "closed" },
        { value: "draft" },
      ],
    },
    {
      key: "label",
      type: "enum",
      values: ["bug", "ui", "wontfix", "good first issue"],
    },
    {
      key: "author",
      type: "user",
      values: [{ value: "@me", label: "Me" }],
      source: searchUsers,
    },
    { key: "created", type: "date" },
    { key: "comments", type: "number" },
    { key: "title", type: "text" },
  ];

  let value = "";
  let query;
  let open = false;
  let changes = 0;
  let searches = [];
  let selected = "";
  const recent = ["is:open label:bug", "author:@me created:>=@today-7d"];

  /** The first query for the stress rows, kept out of the markup. */
  const sample =
    'is:open label:bug author:@me -label:wontfix created:>2026-01-01 "exact phrase"';
</script>

<Stack gap={6}>
  <TokenSearch
    {keys}
    bind:value
    bind:query
    bind:open
    recentQueries={recent}
    labelText="Search issues"
    placeholder="Search issues"
    debounce={0}
    now={new Date(2026, 10, 3)}
    on:change={() => (changes += 1)}
    on:search={(event) => (searches = [...searches, event.detail])}
    on:select={(event) => (selected = event.detail.item.value)}
  />
  <button type="button" data-testid="fill" on:click={() => (value = sample)}>
    Fill
  </button>
  <input data-testid="after" aria-label="After" />
  <output data-testid="value">{value}</output>
  <output data-testid="query">{JSON.stringify(query)}</output>
  <output data-testid="open">{open}</output>
  <output data-testid="changes">{changes}</output>
  <output data-testid="searches">{JSON.stringify(searches)}</output>
  <output data-testid="selected">{selected}</output>
</Stack>
