<script>
  import {
    Bleed,
    Box,
    Breadcrumb,
    BreadcrumbItem,
    Button,
    ButtonSet,
    Column,
    ContainedList,
    ContainedListItem,
    Form,
    NumberInput,
    PageHeader,
    Row,
    Select,
    SelectItem,
    Stack,
    TextInput,
    Toggle,
  } from "carbon-components-svelte";

  const sections = ["General", "Networking", "Backups", "Access"];
  let current = sections[0];
</script>

<PageHeader grid size="sm" title="Settings" subtitle="db-prod-01">
  <svelte:fragment slot="breadcrumb">
    <Breadcrumb noTrailingSlash>
      <BreadcrumbItem href="/">Databases</BreadcrumbItem>
      <BreadcrumbItem href="/">db-prod-01</BreadcrumbItem>
      <BreadcrumbItem href="/" isCurrentPage>Settings</BreadcrumbItem>
    </Breadcrumb>
  </svelte:fragment>
  <Row padding>
    <Column sm={4} md={2} lg={4}>
      <!-- Bleed cancels the items' 1rem padding so their text lines up with the title. -->
      <Bleed left={5}>
        <ContainedList labelText="Sections" hideLabel>
          {#each sections as section}
            <ContainedListItem
              interactive
              aria-current={section === current ? "page" : undefined}
              on:click={() => (current = section)}
            >
              {section}
            </ContainedListItem>
          {/each}
        </ContainedList>
      </Bleed>
    </Column>
    <Column sm={4} md={6} lg={8}>
      <Box paddingY={5}>
        <Form on:submit={(e) => e.preventDefault()}>
          <Stack gap={6}>
            <TextInput labelText="Display name" value="db-prod-01" />
            <Select labelText="Plan" selected="standard">
              <SelectItem value="standard" text="Standard" />
              <SelectItem value="enterprise" text="Enterprise" />
            </Select>
            <NumberInput labelText="Connection limit" value={200} />
            <Toggle labelText="Deletion protection" toggled />
            <ButtonSet>
              <Button kind="secondary">Cancel</Button>
              <Button type="submit">Save</Button>
            </ButtonSet>
          </Stack>
        </Form>
      </Box>
    </Column>
  </Row>
</PageHeader>
