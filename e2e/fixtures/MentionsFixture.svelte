<script>
  import {
    Mentions,
    Modal,
    Stack,
    TextArea,
    TextInput,
    UserAvatar,
  } from "carbon-components-svelte";

  const first = [
    "Alice",
    "Alina",
    "Bob",
    "Carol",
    "Dmitri",
    "Elena",
    "Fatima",
    "Giovanni",
    "Hana",
    "José",
    "Imani",
    "Jun",
  ];
  const last = [
    "Johnson",
    "Petrova",
    "Smith",
    "Danvers",
    "Ivanov",
    "Garcia",
    "Khan",
    "Rossi",
    "Tanaka",
    "Okafor",
  ];

  const users = Array.from({ length: 10000 }, (_, i) => ({
    id: `u${i}`,
    text: `${first[i % first.length]} ${last[Math.floor(i / first.length) % last.length]}${i >= 120 ? ` ${i}` : ""}`,
    secondary: `@user${i}`,
    insertText: `user${i}`,
  }));

  const commands = [
    { id: "help", text: "help", secondary: "Show help" },
    { id: "assign", text: "assign", secondary: "Assign to a user" },
    { id: "close", text: "close", secondary: "Close the issue" },
  ];

  const emoji = [
    { id: "smile", text: "smile", insertText: "\u{1F604}" },
    { id: "smirk", text: "smirk", insertText: "\u{1F60F}" },
    { id: "tada", text: "tada", insertText: "\u{1F389}" },
    { id: "thumbsup", text: "+1", insertText: "\u{1F44D}" },
  ];

  /**
   * Knobs the tests turn: how long a ticket search takes, whether it
   * fails, and whether it honors the abort signal (a source that does not
   * must still not overwrite a newer answer).
   */
  const control = {
    delay: (/** @type {string} */ _query) => 0,
    fail: (/** @type {string} */ _query) => false,
    ignoreAbort: false,
    calls: /** @type {string[]} */ ([]),
    aborted: /** @type {string[]} */ ([]),
  };
  if (typeof window !== "undefined") {
    /** @type {any} */ (window).__mentions = control;
  }

  function searchTickets(
    /** @type {string} */ query,
    /** @type {{ signal: AbortSignal }} */ { signal },
  ) {
    control.calls.push(query);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (control.fail(query)) reject(new Error("offline"));
        else {
          resolve(
            [1, 2, 3].map((n) => ({
              id: `T-${query}${n}`,
              text: `T-${query}${n}`,
              secondary: `Ticket for "${query}" ${n}`,
            })),
          );
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

  /** @type {null | HTMLTextAreaElement} */
  let ref = null;
  let value = "";
  let mentions = [];
  let open = false;
  let lastSelect = "";

  /** @type {null | HTMLInputElement} */
  let inputRef = null;
  let inputValue = "";

  /** @type {null | HTMLTextAreaElement} */
  let tokenRef = null;
  let tokenValue = "";
  let tokenMentions = [];

  /** @type {null | HTMLTextAreaElement} */
  let modalRef = null;
  let modalValue = "";
  let modalOpen = false;

  const triggers = [
    { char: "@", items: users, label: "Users" },
    { char: "#", items: searchTickets, label: "Tickets", debounce: 0 },
    {
      char: ":",
      items: emoji,
      format: "plain",
      minQueryLength: 2,
      label: "Emoji",
    },
    {
      char: "/",
      items: commands,
      format: "plain",
      position: "line-start",
      label: "Commands",
    },
  ];

  const inputTriggers = [{ char: "@", items: users.slice(0, 50) }];
  const tokenTriggers = [
    { char: "@", items: users.slice(0, 50), format: "token" },
  ];
</script>

<Stack gap={6}>
  <div>
    <TextArea
      bind:ref
      bind:value
      labelText="Comment"
      helperText="Type @, #, : or / for suggestions"
      rows={4}
      data-testid="comment"
    />
    <Mentions
      field={ref}
      {triggers}
      bind:mentions
      bind:open
      on:select={(e) => (lastSelect = e.detail.item.id)}
    >
      <svelte:fragment let:item let:highlighted>
        {#if item.secondary?.startsWith("@")}
          <UserAvatar name={item.text} size="sm" />
        {/if}
        <span class="bx--mentions__text">{item.text}</span>
        {#if item.secondary}
          <span class="bx--mentions__secondary">{item.secondary}</span>
        {/if}
      </svelte:fragment>
    </Mentions>
  </div>

  <TextInput
    bind:ref={inputRef}
    bind:value={inputValue}
    labelText="Assignee"
    data-testid="assignee"
  />
  <Mentions field={inputRef} triggers={inputTriggers} />

  <div>
    <TextArea
      bind:ref={tokenRef}
      bind:value={tokenValue}
      labelText="Reply (tokens)"
      rows={2}
      data-testid="token"
    />
    <Mentions
      field={tokenRef}
      triggers={tokenTriggers}
      bind:mentions={tokenMentions}
    />
  </div>

  <button
    type="button"
    data-testid="open-modal"
    on:click={() => (modalOpen = true)}
  >
    Open modal
  </button>

  <p data-testid="value">{value}</p>
  <p data-testid="mentions">{JSON.stringify(mentions)}</p>
  <p data-testid="open">{open}</p>
  <p data-testid="select">{lastSelect}</p>
  <p data-testid="token-value">{tokenValue}</p>
  <p data-testid="token-mentions">{JSON.stringify(tokenMentions)}</p>
</Stack>

<Modal
  bind:open={modalOpen}
  size="sm"
  modalHeading="Reply"
  primaryButtonText="Send"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (modalOpen = false)}
>
  <TextArea
    bind:ref={modalRef}
    bind:value={modalValue}
    labelText="Message"
    rows={3}
    data-testid="modal-field"
  />
  <Mentions
    field={modalRef}
    triggers={[{ char: "@", items: users.slice(0, 50) }]}
  />
</Modal>
