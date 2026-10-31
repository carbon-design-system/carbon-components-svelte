<script>
  import {
    Accordion,
    AccordionItem,
    BigNumber,
    Breadcrumb,
    BreadcrumbItem,
    Button,
    ButtonSet,
    Checkbox,
    CodeSnippet,
    Column,
    ComboBox,
    ContainedList,
    ContainedListItem,
    Content,
    ContentSwitcher,
    DataTable,
    DatePicker,
    DatePickerInput,
    FileUploaderDropContainer,
    Form,
    FormGroup,
    Grid,
    Header,
    HeaderGlobalAction,
    HeaderNav,
    HeaderNavItem,
    HeaderNavMenu,
    HeaderUtilities,
    Heading,
    InlineNotification,
    Link,
    Modal,
    MultiSelect,
    NumberInput,
    OverflowMenu,
    OverflowMenuItem,
    PageHeader,
    Pagination,
    ProgressIndicator,
    ProgressStep,
    RadioButton,
    RadioButtonGroup,
    Row,
    Search,
    Section,
    Select,
    SelectItem,
    SideNav,
    SideNavDivider,
    SideNavItems,
    SideNavLink,
    SideNavMenu,
    SideNavMenuItem,
    SkipToContent,
    Slider,
    Stack,
    StructuredList,
    StructuredListBody,
    StructuredListCell,
    StructuredListHead,
    StructuredListRow,
    Switch,
    Tag,
    Text,
    TextArea,
    TextInput,
    Theme,
    Tile,
    Toggle,
    Toggletip,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";
  import { DevToolbar } from "carbon-components-svelte/devtools";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Copy from "carbon-icons-svelte/lib/Copy.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
  import Notification from "carbon-icons-svelte/lib/Notification.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";
  import UserAvatar from "carbon-icons-svelte/lib/UserAvatar.svelte";
  import { onMount } from "svelte";

  let isSideNavOpen = false;
  let modalOpen = false;

  // Seeds layout bugs for the checks to find. Turn it off to see what
  // the tools say about a page built only from Carbon parts.
  let seedBugs = true;

  // Runs the checks on Carbon's own components too.
  let checkCarbon = false;

  // Adds 1,000 list rows and a clock that changes ten times a second,
  // to feel what the checks cost on a long, busy page.
  let stress = false;

  const STATUS = [
    { text: "Running", type: "green" },
    { text: "Deploying", type: "blue" },
    { text: "Failed", type: "red" },
    { text: "Paused", type: "gray" },
  ];

  const REGIONS = ["us-south", "us-east", "eu-de", "jp-tok", "au-syd"];

  const deployments = Array.from({ length: 48 }, (_, index) => ({
    id: index,
    name: `service-${String(index + 1).padStart(2, "0")}`,
    region: REGIONS[index % REGIONS.length],
    status: STATUS[index % STATUS.length],
    replicas: (index % 5) + 1,
    updated: `${(index % 23) + 1}h ago`,
  }));

  const headers = [
    { key: "name", value: "Name" },
    { key: "region", value: "Region" },
    { key: "status", value: "Status" },
    { key: "replicas", value: "Replicas" },
    { key: "updated", value: "Updated" },
    { key: "overflow", empty: true },
  ];

  let page = 1;
  let pageSize = 10;
  let selectedRowIds = [];

  const metrics = [
    { label: "Requests", value: 1284000 },
    { label: "Error rate", value: 0.4, percentage: true },
    { label: "p95 latency (ms)", value: 182 },
    { label: "Active users", value: 9312 },
  ];

  const languages = [
    { id: "node", text: "Node.js" },
    { id: "python", text: "Python" },
    { id: "go", text: "Go" },
    { id: "java", text: "Java" },
  ];

  const events = Array.from({ length: 1000 }, (_, index) => ({
    id: index,
    text: `Health check ${1000 - index} passed in ${(index % 40) + 12}ms`,
  }));

  let now = new Date();
  /** @type {ReturnType<typeof setInterval> | undefined} */
  let clock;
  $: {
    clearInterval(clock);
    clock = stress
      ? setInterval(() => {
          now = new Date();
        }, 100)
      : undefined;
  }
  onMount(() => () => clearInterval(clock));
</script>

<Header companyName="Acme" platformName="Console" bind:isSideNavOpen>
  <svelte:fragment slot="skipToContent"><SkipToContent /></svelte:fragment>
  <HeaderNav>
    <HeaderNavItem href="#overview" text="Overview" />
    <HeaderNavItem href="#deployments" text="Deployments" />
    <HeaderNavMenu text="Manage">
      <HeaderNavItem href="#create" text="Create a service" />
      <HeaderNavItem href="#activity" text="Activity" />
    </HeaderNavMenu>
  </HeaderNav>
  <HeaderUtilities>
    <HeaderGlobalAction iconDescription="Notifications" icon={Notification} />
    <HeaderGlobalAction iconDescription="Profile" icon={UserAvatar} />
  </HeaderUtilities>
</Header>

<SideNav bind:isOpen={isSideNavOpen}>
  <SideNavItems>
    <SideNavLink href="#overview" text="Overview" isSelected />
    <SideNavLink href="#deployments" text="Deployments" />
    <SideNavMenu text="Services">
      <SideNavMenuItem href="#create" text="Create a service" />
      <SideNavMenuItem href="#activity" text="Activity" />
    </SideNavMenu>
    <SideNavDivider />
    <SideNavLink href="#seeded" text="Seeded bugs" />
  </SideNavItems>
</SideNav>

<Content>
  <Stack gap={9}>
    <PageHeader
      title="Production"
      subtitle="All services in the default project"
    >
      <svelte:fragment slot="breadcrumb">
        <Breadcrumb noTrailingSlash>
          <BreadcrumbItem href="#overview">Projects</BreadcrumbItem>
          <BreadcrumbItem href="#overview">Default</BreadcrumbItem>
        </Breadcrumb>
      </svelte:fragment>
      <svelte:fragment slot="actions">
        <Button kind="tertiary" size="field">Export</Button>
        <Button size="field" icon={Add} on:click={() => (modalOpen = true)}>
          Add service
        </Button>
      </svelte:fragment>
    </PageHeader>

    <Grid>
      <Row>
        <Column>
          <Tile>
            <Row>
              <Column sm={4} md={5} lg={11}>
                <Stack gap={5}>
                  <Heading type="heading-compact-02">
                    Kitchen sink controls
                  </Heading>
                  <Text type="body-compact-01" color="secondary">
                    Turn on tools from the toolbar at the bottom. Seeded bugs
                    add mistakes for the checks to find. Checking Carbon too
                    shows what the checks say about Carbon's own components.
                    Stress mode adds 1,000 rows and a clock that changes ten
                    times a second.
                  </Text>
                  <Stack orientation="horizontal" gap={7} wrap="wrap">
                    <Toggle
                      labelText="Seeded bugs"
                      size="sm"
                      bind:toggled={seedBugs}
                    />
                    <Toggle
                      labelText="Check Carbon too"
                      size="sm"
                      bind:toggled={checkCarbon}
                    />
                    <Toggle
                      labelText="Stress mode"
                      size="sm"
                      bind:toggled={stress}
                    />
                  </Stack>
                </Stack>
              </Column>
              <Column sm={4} md={3} lg={5}>
                <Theme render="select" />
              </Column>
            </Row>
          </Tile>
        </Column>
      </Row>
    </Grid>

    <Section level={2}>
      <Grid>
        <Stack gap={7}>
          <Row>
            <Column>
              <Heading id="overview">Overview</Heading>
            </Column>
          </Row>
          <Row>
            {#each metrics as metric (metric.label)}
              <Column sm={2} md={4} lg={4}>
                <Tile>
                  <BigNumber
                    labelText={metric.label}
                    value={metric.value}
                    percentage={metric.percentage}
                  />
                </Tile>
              </Column>
            {/each}
          </Row>
          <Row>
            <Column>
              <InlineNotification
                lowContrast
                kind="warning"
                title="Maintenance"
                subtitle="eu-de restarts on Sunday at 02:00 UTC."
              />
            </Column>
          </Row>
          {#if stress}
            <Row>
              <Column>
                <Text type="code-02">{now.toISOString()}</Text>
              </Column>
            </Row>
          {/if}
        </Stack>
      </Grid>
    </Section>

    <Section level={2}>
      <Grid>
        <Stack gap={7}>
          <Row>
            <Column>
              <Heading id="deployments">Deployments</Heading>
            </Column>
          </Row>
          <Row>
            <Column>
              <DataTable
                selectable
                batchSelection
                sortable
                bind:selectedRowIds
                {headers}
                rows={deployments}
                {page}
                {pageSize}
              >
                <Toolbar>
                  <ToolbarContent>
                    <ToolbarSearch persistent shouldFilterRows />
                    <Button icon={Add}>Deploy</Button>
                  </ToolbarContent>
                </Toolbar>
                <svelte:fragment slot="cell" let:cell let:row>
                  {#if cell.key === "status"}
                    <Tag size="sm" type={row.status.type}>{row.status.text}</Tag
                    >
                  {:else if cell.key === "overflow"}
                    <OverflowMenu flipped size="sm" iconDescription="Actions">
                      <OverflowMenuItem text="Restart" />
                      <OverflowMenuItem text="Scale" />
                      <OverflowMenuItem danger text="Delete" />
                    </OverflowMenu>
                  {:else}
                    {cell.value}
                  {/if}
                </svelte:fragment>
              </DataTable>
              <Pagination
                bind:page
                bind:pageSize
                totalItems={deployments.length}
                pageSizes={[10, 20, 48]}
              />
            </Column>
          </Row>
        </Stack>
      </Grid>
    </Section>

    <Section level={2}>
      <Grid>
        <Stack gap={7}>
          <Row>
            <Column>
              <Heading id="create">Create a service</Heading>
            </Column>
          </Row>
          <Row>
            <Column sm={4} md={6} lg={8}>
              <Form on:submit={(e) => e.preventDefault()}>
                <Stack gap={7}>
                  <TextInput
                    labelText="Service name"
                    placeholder="service-49"
                    helperText="Lowercase letters, numbers, and dashes."
                  />
                  <TextArea labelText="Description" rows={3} />
                  <Select labelText="Region">
                    {#each REGIONS as region (region)}
                      <SelectItem value={region} text={region} />
                    {/each}
                  </Select>
                  <ComboBox
                    labelText="Runtime"
                    placeholder="Choose a runtime"
                    items={languages}
                  />
                  <MultiSelect
                    labelText="Notify"
                    placeholder="Choose channels"
                    items={[
                      { id: "email", text: "Email" },
                      { id: "slack", text: "Slack" },
                      { id: "pager", text: "Pager" },
                    ]}
                  />
                  <DatePicker datePickerType="single">
                    <DatePickerInput
                      labelText="Go-live date"
                      placeholder="mm/dd/yyyy"
                    />
                  </DatePicker>
                  <NumberInput
                    labelText="Replicas"
                    value={3}
                    min={1}
                    max={20}
                  />
                  <Slider labelText="Memory (GB)" min={1} max={64} value={8} />
                  <FormGroup legendText="Features">
                    <Checkbox labelText="Autoscaling" checked />
                    <Checkbox labelText="Health checks" checked />
                    <Checkbox labelText="Private network" />
                    <Checkbox labelText="Backups" />
                  </FormGroup>
                  <RadioButtonGroup legendText="Plan" selected="standard">
                    <RadioButton labelText="Lite" value="lite" />
                    <RadioButton labelText="Standard" value="standard" />
                    <RadioButton labelText="Enterprise" value="enterprise" />
                  </RadioButtonGroup>
                  <Toggle labelText="Start after create" toggled />
                  <FileUploaderDropContainer
                    labelText="Drop an env file here or click to upload"
                  />
                  <ButtonSet>
                    <Button kind="secondary">Cancel</Button>
                    <Button type="submit">Create</Button>
                  </ButtonSet>
                </Stack>
              </Form>
            </Column>
            <Column sm={4} md={2} lg={{ span: 6, offset: 2 }}>
              <Stack gap={7}>
                <ProgressIndicator vertical currentIndex={1}>
                  <ProgressStep complete label="Name" />
                  <ProgressStep label="Configure" />
                  <ProgressStep label="Review" />
                </ProgressIndicator>
                <Stack gap={3}>
                  <Stack orientation="horizontal" gap={3} align="center">
                    <Text type="heading-compact-01">Pricing</Text>
                    <Toggletip labelText="About pricing">
                      <Text type="body-compact-01">
                        Billed per second, rounded up to the minute.
                      </Text>
                    </Toggletip>
                  </Stack>
                  <Text type="body-01">
                    A Standard plan with 3 replicas costs about $42 a month. See
                    <Link inline href="#create">the pricing guide</Link>
                    for regional rates.
                  </Text>
                </Stack>
                <CodeSnippet type="multi"
                  >{`acme deploy service-49 \\
  --region us-south \\
  --replicas 3 \\
  --memory 8G`}</CodeSnippet
                >
              </Stack>
            </Column>
          </Row>
        </Stack>
      </Grid>
    </Section>

    <Section level={2}>
      <Grid>
        <Stack gap={7}>
          <Row>
            <Column>
              <Heading id="activity">Activity</Heading>
            </Column>
          </Row>
          <Row>
            <Column sm={4} md={8} lg={8}>
              <Stack gap={7}>
                <ContentSwitcher>
                  <Switch text="Today" />
                  <Switch text="This week" />
                  <Switch text="This month" />
                </ContentSwitcher>
                <Search placeholder="Filter activity" />
                <ContainedList labelText="Recent events" kind="on-page">
                  {#each events.slice(0, stress ? events.length : 8) as event (event.id)}
                    <ContainedListItem>{event.text}</ContainedListItem>
                  {/each}
                </ContainedList>
              </Stack>
            </Column>
            <Column sm={4} md={8} lg={8}>
              <Stack gap={7}>
                <Accordion>
                  <AccordionItem open title="Why did service-03 fail?">
                    <Text type="body-01">
                      The container exited with code 137 after it ran out of
                      memory. Raise the memory limit or lower the cache size.
                    </Text>
                  </AccordionItem>
                  <AccordionItem title="How do I roll back?">
                    <Text type="body-01">
                      Open the service, pick an earlier revision, and select
                      Roll back.
                    </Text>
                  </AccordionItem>
                  <AccordionItem title="Who gets paged?">
                    <Text type="body-01"
                      >The on-call engineer for the project.</Text
                    >
                  </AccordionItem>
                </Accordion>
                <StructuredList condensed>
                  <StructuredListHead>
                    <StructuredListRow head>
                      <StructuredListCell head>Revision</StructuredListCell>
                      <StructuredListCell head>Author</StructuredListCell>
                      <StructuredListCell head>Age</StructuredListCell>
                    </StructuredListRow>
                  </StructuredListHead>
                  <StructuredListBody>
                    {#each [41, 40, 39, 38] as revision, index (revision)}
                      <StructuredListRow>
                        <StructuredListCell noWrap
                          >r{revision}</StructuredListCell
                        >
                        <StructuredListCell>
                          {["ana", "kofi", "mei", "raj"][index]}
                        </StructuredListCell>
                        <StructuredListCell>{index + 1}d</StructuredListCell>
                      </StructuredListRow>
                    {/each}
                  </StructuredListBody>
                </StructuredList>
              </Stack>
            </Column>
          </Row>
        </Stack>
      </Grid>
    </Section>

    {#if seedBugs}
      <Section level={2}>
        <Grid>
          <Stack gap={7}>
            <Row>
              <Column>
                <Heading id="seeded">Seeded bugs</Heading>
              </Column>
            </Row>
            <Row>
              <Column sm={4} md={4} lg={8}>
                <Stack gap={7}>
                  <!-- Off-scale spacing: 13px padding and a 20px gap. -->
                  <div class="seeded-card">
                    <p class="seeded-title">Off-scale card</p>
                    <p class="seeded-faint">
                      Faint helper text that fails contrast.
                    </p>
                  </div>
                  <!-- Small targets: 16px icon buttons 4px apart. -->
                  <div class="seeded-actions">
                    <button class="seeded-icon" type="button" aria-label="Edit">
                      <Edit />
                    </button>
                    <button class="seeded-icon" type="button" aria-label="Copy">
                      <Copy />
                    </button>
                    <button
                      class="seeded-icon"
                      type="button"
                      aria-label="Delete"
                    >
                      <TrashCan />
                    </button>
                  </div>
                  <!-- Off the type scale: 15/22, no Carbon token matches. -->
                  <p class="seeded-type">
                    This paragraph uses 15/22 type, between body-01 and body-02,
                    so its baselines drift off the 8px rows.
                  </p>
                </Stack>
              </Column>
              <Column sm={4} md={4} lg={8}>
                <Stack gap={7}>
                  <!-- Clipped: ellipsis truncation. -->
                  <p class="seeded-truncate">
                    service-49.us-south.containers.appdomain.cloud/api/v2/health
                  </p>
                  <!-- Overflow: wider than the page, so it scrolls sideways. -->
                  <p class="seeded-wide">
                    A fixed 1600px banner that pushes the page into horizontal
                    scroll.
                  </p>
                  <!-- A scroll container: its content does not overflow the page. -->
                  <div class="seeded-scroller">
                    <ContainedList labelText="Logs" kind="disclosed">
                      {#each events.slice(0, 20) as event (event.id)}
                        <ContainedListItem>{event.text}</ContainedListItem>
                      {/each}
                    </ContainedList>
                  </div>
                </Stack>
              </Column>
            </Row>
          </Stack>
        </Grid>
      </Section>
    {/if}
  </Stack>
</Content>

<Modal
  bind:open={modalOpen}
  modalHeading="Add service"
  primaryButtonText="Add"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (modalOpen = false)}
  on:submit={() => (modalOpen = false)}
>
  <TextInput labelText="Service name" placeholder="service-49" />
</Modal>

<DevToolbar
  persistKey="ccs-dev-toolbar-kitchen-sink"
  gridProps={{ baselineOffset: 48 }}
  inspectorProps={{ checkCarbon }}
/>

<style>
  /* Seeded bugs, on purpose. Each is a plain element, because the checks
     skip Carbon's own components unless checkCarbon is on. */
  .seeded-card {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 13px;
    background: var(--cds-layer-01);
  }

  .seeded-title {
    font-size: 1rem;
    font-weight: 600;
  }

  .seeded-faint {
    color: #b0b0b0;
  }

  .seeded-actions {
    display: flex;
    gap: 4px;
  }

  .seeded-icon {
    display: inline-flex;
    width: 16px;
    height: 16px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--cds-icon-primary);
    cursor: pointer;
  }

  .seeded-type {
    font-size: 15px;
    line-height: 22px;
  }

  .seeded-truncate {
    max-width: 16rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .seeded-wide {
    width: 1600px;
  }

  .seeded-scroller {
    max-height: 12rem;
    overflow: auto;
  }
</style>
