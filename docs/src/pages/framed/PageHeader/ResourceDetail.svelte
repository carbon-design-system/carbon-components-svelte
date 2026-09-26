<script>
  import {
    BigNumber,
    Breadcrumb,
    BreadcrumbItem,
    Column,
    ComboButton,
    DataTable,
    DescriptionList,
    DescriptionListItem,
    MenuItem,
    PageHeader,
    Row,
    Tab,
    TabContent,
    Tabs,
    Tag,
    Tile,
  } from "carbon-components-svelte";
  import DataBase from "carbon-icons-svelte/lib/DataBase.svelte";

  const queries = [
    { id: 1, query: "SELECT * FROM orders", duration: "12 ms", calls: 4210 },
    { id: 2, query: "UPDATE carts SET …", duration: "8 ms", calls: 1804 },
    { id: 3, query: "SELECT id FROM users", duration: "3 ms", calls: 9921 },
  ];
</script>

<PageHeader
  grid
  eyebrow="Database"
  eyebrowIcon={DataBase}
  title="db-prod-01"
  subtitle="PostgreSQL 16 · us-south"
>
  <svelte:fragment slot="breadcrumb">
    <Breadcrumb noTrailingSlash>
      <BreadcrumbItem href="/">Resources</BreadcrumbItem>
      <BreadcrumbItem href="/">Databases</BreadcrumbItem>
      <BreadcrumbItem href="/" isCurrentPage>db-prod-01</BreadcrumbItem>
    </Breadcrumb>
  </svelte:fragment>
  <svelte:fragment slot="titleEnd">
    <Tag type="green" size="sm">Running</Tag>
  </svelte:fragment>
  <svelte:fragment slot="actions">
    <ComboButton
      size="lg"
      labelText="Connect"
      iconDescription="More actions"
      tooltipAlignment="end"
    >
      <MenuItem>Restart</MenuItem>
      <MenuItem>Create backup</MenuItem>
      <MenuItem kind="danger">Delete</MenuItem>
    </ComboButton>
  </svelte:fragment>
  <svelte:fragment slot="meta">
    <DescriptionList columns={4}>
      <DescriptionListItem term="Plan">Standard</DescriptionListItem>
      <DescriptionListItem term="Storage">42 GB</DescriptionListItem>
      <DescriptionListItem term="Version">16.2</DescriptionListItem>
      <DescriptionListItem term="Created">March 14, 2026</DescriptionListItem>
    </DescriptionList>
  </svelte:fragment>
  <svelte:fragment slot="tabs">
    <Tabs>
      <Tab label="Overview" />
      <Tab label="Backups" />
      <Tab label="Settings" />
    </Tabs>
  </svelte:fragment>
  <TabContent>
    <Row padding>
      <Column sm={4} md={4} lg={5}>
        <Tile><BigNumber labelText="Connections" value={128} /></Tile>
      </Column>
      <Column sm={4} md={4} lg={5}>
        <Tile><BigNumber labelText="Queries per second" value={2400} /></Tile>
      </Column>
      <Column sm={4} md={8} lg={6}>
        <Tile><BigNumber labelText="Replicas" value={3} /></Tile>
      </Column>
    </Row>
    <Row padding>
      <Column>
        <DataTable
          title="Slowest queries"
          headers={[
            { key: "query", value: "Query" },
            { key: "duration", value: "Mean duration" },
            { key: "calls", value: "Calls" },
          ]}
          rows={queries}
        />
      </Column>
    </Row>
  </TabContent>
  <TabContent>
    <Row padding>
      <Column>Nightly backups, kept for 30 days.</Column>
    </Row>
  </TabContent>
  <TabContent>
    <Row padding>
      <Column>Maintenance window: Sundays, 02:00 UTC.</Column>
    </Row>
  </TabContent>
</PageHeader>
