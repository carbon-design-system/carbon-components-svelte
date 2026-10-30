<script>
  import {
    Button,
    Coachmark,
    CoachmarkBeacon,
    DataTable,
    Header,
    HeaderGlobalAction,
    HeaderUtilities,
    LocalStorage,
    Tab,
    TabContent,
    Tabs,
    Toolbar,
    ToolbarContent,
  } from "carbon-components-svelte";
  import Notification from "carbon-icons-svelte/lib/Notification.svelte";
  import { onMount } from "svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
  ];
  const rows = [{ id: "a", name: "Load Balancer 1", protocol: "HTTP" }];

  let events = [];
  const log = (name) => (e) => {
    events = [...events, `${name}:${e.type}:${e.detail.trigger}`];
  };

  // A tour driven by the consumer: one coachmark per step.
  const tour = ["First", "Second", "Third"];
  let tourStep = -1;
  let tabTip = false;

  // The "seen" flag outlives the page.
  let seen = false;
  let seenOpen = false;
  onMount(() => {
    seenOpen = !seen;
  });
</script>

<LocalStorage key="e2e-coachmark-seen" bind:value={seen} />

<Header companyName="E2E" platformName="Coachmark">
  <HeaderUtilities>
    <Coachmark
      id="cm-header"
      title="Notifications"
      align="bottom-end"
      data-testid="cm-header"
    >
      <HeaderGlobalAction
        slot="target"
        let:triggerProps
        let:toggle
        {...triggerProps}
        aria-label="Notifications"
        icon={Notification}
        on:click={toggle}
      />
      Your alerts collect here.
    </Coachmark>
  </HeaderUtilities>
</Header>

<main style="padding: 4rem 1rem 1rem">
  <section data-testid="basic">
    <h3>Basic</h3>
    <Coachmark
      id="cm-basic"
      title="Export in bulk"
      align="bottom-start"
      data-testid="cm-basic"
      on:open={log("basic")}
      on:close={log("basic")}
    >
      <p>Select rows, then use the toolbar to export them together.</p>
      <svelte:fragment slot="actions">
        <Button size="sm" data-modal-primary-focus>Try it</Button>
      </svelte:fragment>
    </Coachmark>
    <input data-testid="unrelated" aria-label="Unrelated field" />
    <p data-testid="events">{events.join(",")}</p>
  </section>

  <section data-testid="toolbar">
    <h3>DataTable toolbar</h3>
    <DataTable title="Balancers" {headers} {rows}>
      <Toolbar>
        <ToolbarContent>
          <Coachmark id="cm-toolbar" title="Filters" align="bottom-end">
            <Button
              slot="target"
              let:triggerProps
              let:toggle
              {...triggerProps}
              kind="ghost"
              on:click={toggle}
            >
              Filter
            </Button>
            Filter by name or protocol.
          </Coachmark>
          <Button>Create</Button>
        </ToolbarContent>
      </Toolbar>
    </DataTable>
  </section>

  <section data-testid="tabs">
    <h3>Tabs</h3>
    <Button data-testid="show-tab-tip" on:click={() => (tabTip = true)}>
      Show tab tip
    </Button>
    <Tabs>
      <Tab>
        Overview
        <!-- The tab is the control, so the dot is inert and the tour opens
        the coachmark. A button here would nest inside the tab. -->
        <Coachmark
          id="cm-tab"
          title="Details moved"
          portalTooltip
          bind:open={tabTip}
          data-testid="cm-tab"
        >
          <span
            slot="target"
            data-testid="tab-dot"
            style="display: inline-block; width: 8px; height: 8px; margin-inline-start: 8px; border-radius: 50%; background: var(--cds-interactive)"
          ></span>
          Find the details here now.
        </Coachmark>
      </Tab>
      <Tab label="Settings" />
      <svelte:fragment slot="content">
        <TabContent>Overview content</TabContent>
        <TabContent>Settings content</TabContent>
      </svelte:fragment>
    </Tabs>
  </section>

  <section data-testid="overlay">
    <h3>Overlay beacon</h3>
    <Coachmark id="cm-overlay" title="New" align="right-start">
      <svelte:fragment slot="target" let:triggerProps let:toggle>
        <Button kind="tertiary">Share</Button>
        <CoachmarkBeacon
          overlay
          label="Show what is new about Share"
          {...triggerProps}
          on:click={toggle}
        />
      </svelte:fragment>
      Share a view with a link.
    </Coachmark>
  </section>

  <section data-testid="tour">
    <h3>Tour</h3>
    <Button data-testid="start-tour" on:click={() => (tourStep = 0)}>
      Start tour
    </Button>
    {#each tour as name, i}
      <Coachmark
        id="cm-tour-{i}"
        title="{name} stop"
        focusOnOpen
        open={tourStep === i}
        on:close={(e) => {
          if (tourStep === i) tourStep = -1;
          events = [...events, `tour${i}:${e.detail.trigger}`];
        }}
      >
        <Button
          slot="target"
          let:triggerProps
          let:toggle
          {...triggerProps}
          size="sm"
          kind="tertiary"
          on:click={toggle}
        >
          {name}
        </Button>
        Step {i + 1} of {tour.length}.
        <svelte:fragment slot="actions">
          <Button
            size="sm"
            data-modal-primary-focus
            on:click={() => (tourStep = i + 1 < tour.length ? i + 1 : -1)}
          >
            {i + 1 < tour.length ? "Next" : "Finish"}
          </Button>
        </svelte:fragment>
      </Coachmark>
    {/each}
  </section>

  <section data-testid="persist">
    <h3>Persisting dismissal</h3>
    <Coachmark
      id="cm-persist"
      title="Saved views"
      open={seenOpen}
      on:close={() => {
        seenOpen = false;
        seen = true;
      }}
    >
      Pick up where you left off.
    </Coachmark>
    <p data-testid="seen">{seen ? "seen" : "not seen"}</p>
  </section>
</main>
