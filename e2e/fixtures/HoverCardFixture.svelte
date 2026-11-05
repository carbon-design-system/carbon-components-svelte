<script>
  import {
    Button,
    HoverCard,
    Link,
    Tag,
    UserAvatar,
  } from "carbon-components-svelte";

  let followed = false;
  let loads = 0;
  let aborts = 0;
  let open = false;

  // A request that takes a second and aborts with its signal.
  function loadProfile({ signal }) {
    loads += 1;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => resolve({ name: "Mona Lisa Octocat", login: "octocat" }),
        1000,
      );
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        aborts += 1;
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
  }
</script>

<div
  data-testid="stats"
  data-loads={loads}
  data-aborts={aborts}
  data-open={open}
  data-followed={followed}
></div>

<p data-testid="inline" class="bx--type-body-01" style="padding: 2rem">
  Reviewed by
  <HoverCard id="user" bind:open aria-label="Profile of @octocat">
    <Link slot="trigger" href="#octocat" data-testid="user-trigger"
      >@octocat</Link
    >
    <div style="display: flex; gap: 1rem; align-items: center">
      <UserAvatar name="Mona Lisa Octocat" size="lg" />
      <div>
        <strong>Mona Lisa Octocat</strong>
        <p>Maintainer. San Francisco.</p>
      </div>
    </div>
    <div style="display: flex; gap: 0.5rem">
      <Button
        size="sm"
        data-testid="follow"
        on:click={() => (followed = !followed)}
      >
        {followed ? "Following" : "Follow"}
      </Button>
      <Button size="sm" kind="tertiary" data-testid="message">Message</Button>
    </div>
  </HoverCard>
  and
  <HoverCard id="issue" size="sm">
    <Link slot="trigger" href="#issue-42" data-testid="issue-trigger">#42</Link>
    <p><Tag type="green">Open</Tag></p>
    <p>Hover cards lose their position inside a clipped table cell.</p>
  </HoverCard>
  .
</p>

<div
  data-testid="clipped"
  style="overflow: hidden; width: 240px; height: 72px; margin: 0 2rem; border: 1px solid var(--cds-border-subtle)"
>
  <HoverCard id="clipped-card" openDelay={100}>
    <Link slot="trigger" href="#clipped" data-testid="clipped-trigger"
      >Clipped</Link
    >
    <p data-testid="clipped-body">This card outgrows the box around it.</p>
    <Button size="sm" data-testid="clipped-action">Action</Button>
    <Button size="sm" kind="ghost" data-testid="clipped-action-2">Other</Button>
  </HoverCard>
</div>

<p style="padding: 2rem">
  <HoverCard
    id="async"
    load={loadProfile}
    cacheKey="octocat"
    cacheMs={0}
    openDelay={100}
  >
    <Link slot="trigger" href="#async" data-testid="async-trigger">Async</Link>
    <svelte:fragment let:data>
      <p data-testid="async-body">{data.name} (@{data.login})</p>
    </svelte:fragment>
  </HoverCard>
</p>

<div style="position: fixed; inset-inline-end: 8px; inset-block-end: 8px">
  <HoverCard id="edge" openDelay={100} align="end">
    <Link slot="trigger" href="#edge" data-testid="edge-trigger">Edge</Link>
    <p data-testid="edge-body">A card at the corner of the window.</p>
    <Button size="sm" data-testid="edge-action">Action</Button>
  </HoverCard>
</div>

<div style="padding: 2rem">
  <Button data-testid="before">Before</Button>
  <HoverCard id="tabs" openDelay={100}>
    <Button slot="trigger" kind="tertiary" data-testid="tabs-trigger">
      Tab target
    </Button>
    <Button size="sm" data-testid="tabs-first">First</Button>
    <Button size="sm" data-testid="tabs-last">Last</Button>
  </HoverCard>
  <Button data-testid="after">After</Button>
</div>
