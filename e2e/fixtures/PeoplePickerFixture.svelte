<script>
  import { Button, Modal, PeoplePicker } from "carbon-components-svelte";
  import { arabic, makeDirectory, team } from "./people-picker-data.js";

  const recent = team.slice(2, 5);
  const directory = makeDirectory(10000);
  const big = Array.from({ length: 50 }, (_, i) => ({
    id: `w${i}`,
    name: `Watcher ${i + 1}`,
    email: `watcher${i + 1}@example.com`,
  }));

  let assignees = [];
  let shared = [];
  let reviewers = [];
  let everyone = [];
  let members = [];
  let owner = [];
  let watchers = big;
  let arabicValue = [arabic[0]];
  let modalValue = [];
  let modalOpen = false;
  let submitted = "";

  // The test drives the async source through `window.__pp`.
  const control = {
    calls: [],
    delays: {},
    fail: false,
    ignoreAbort: false,
    failMembers: false,
  };
  if (typeof window !== "undefined") window.__pp = control;

  function asyncSource(query, { signal }) {
    const call = { query, aborted: false };
    control.calls.push(call);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (control.fail) reject(new Error("offline"));
        else {
          const q = query.toLowerCase();
          resolve(
            directory
              .filter((p) => p.name.toLowerCase().includes(q))
              .slice(0, 8),
          );
        }
      }, control.delays[query] ?? 20);
      if (!control.ignoreAbort) {
        signal.addEventListener("abort", () => {
          call.aborted = true;
          clearTimeout(timer);
          reject(new DOMException("aborted", "AbortError"));
        });
      }
    });
  }

  function loadMembers() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (control.failMembers) reject(new Error("offline"));
        else
          resolve([
            { id: "p1", name: "Platform Pat", email: "pat@example.com" },
            { id: "p2", name: "Platform Pia", email: "pia@example.com" },
          ]);
      }, 20);
    });
  }

  function onSubmit(event) {
    event.preventDefault();
    submitted = JSON.stringify(
      Array.from(new FormData(event.currentTarget).entries()),
    );
  }
</script>

<form
  on:submit={onSubmit}
  style="display: grid; gap: 1.5rem; max-width: 36rem;"
>
  <PeoplePicker
    labelText="Assignees"
    helperText="Type a name or email"
    placeholder="Search people"
    items={team}
    suggestions={recent}
    bind:value={assignees}
  />
  <div data-testid="value">{JSON.stringify(assignees.map((p) => p.name))}</div>

  <PeoplePicker
    labelText="Share with"
    name="share"
    allowEmail
    items={team}
    bind:value={shared}
  />
  <div data-testid="shared">{JSON.stringify(shared)}</div>

  <PeoplePicker
    labelText="Reviewers"
    items={asyncSource}
    debounce={30}
    bind:value={reviewers}
  />
  <div data-testid="reviewers">
    {JSON.stringify(reviewers.map((p) => p.name))}
  </div>

  <PeoplePicker labelText="Everyone" items={directory} bind:value={everyone} />
  <div data-testid="everyone">{everyone.length}</div>

  <PeoplePicker
    labelText="Team"
    groups="expand"
    items={team}
    {loadMembers}
    bind:value={members}
  />
  <div data-testid="members">{JSON.stringify(members.map((p) => p.name))}</div>

  <PeoplePicker
    labelText="Owner"
    multiple={false}
    items={team}
    bind:value={owner}
  />
  <div data-testid="owner">{JSON.stringify(owner.map((p) => p.name))}</div>

  <PeoplePicker labelText="Watchers" items={directory} bind:value={watchers} />
  <div data-testid="watchers">{watchers.length}</div>

  <PeoplePicker labelText="المستلمون" items={arabic} bind:value={arabicValue} />

  <PeoplePicker labelText="Read-only" readonly value={team.slice(2, 4)} />
  <PeoplePicker labelText="Disabled" disabled value={team.slice(2, 4)} />
  <PeoplePicker
    labelText="Invalid"
    invalid
    invalidText="Add at least two people"
    value={team.slice(2, 3)}
  />
  <PeoplePicker
    labelText="Warning"
    warn
    warnText="Someone here is outside the team"
    value={team.slice(2, 3)}
  />

  <Button type="submit">Submit</Button>
  <Button kind="secondary" on:click={() => (modalOpen = true)}
    >Open modal</Button
  >
  <pre data-testid="submitted">{submitted}</pre>
</form>

<Modal
  bind:open={modalOpen}
  modalHeading="Invite people"
  primaryButtonText="Invite"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (modalOpen = false)}
>
  <PeoplePicker labelText="Invitees" items={team} bind:value={modalValue} />
  <div data-testid="modal-value">
    {JSON.stringify(modalValue.map((p) => p.name))}
  </div>
</Modal>
