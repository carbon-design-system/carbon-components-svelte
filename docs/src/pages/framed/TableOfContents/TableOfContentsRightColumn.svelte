<script>
  import {
    Box,
    Column,
    Grid,
    Prose,
    Row,
    Stack,
    TableOfContents,
    TableOfContentsItem,
  } from "carbon-components-svelte";

  const sections = [
    {
      id: "installation",
      title: "Installation",
      body: "Add the package with your package manager and import the styles once in the app's entry point.",
    },
    {
      id: "usage",
      title: "Usage",
      body: "Import a component by name and pass it props. Every component works with server rendering.",
    },
    {
      id: "props",
      title: "Props",
      body: "Props are typed. Your editor lists each one with its default value and a short description.",
    },
    {
      id: "events",
      title: "Events",
      body: "Components dispatch events with the new value in detail, so handlers don't read the DOM.",
    },
    {
      id: "accessibility",
      title: "Accessibility",
      body: "Every component is keyboard operable and follows the WAI-ARIA authoring practices.",
    },
  ];
</script>

<Grid>
  <Row>
    <Column sm={4} md={6} lg={12}>
      <Stack gap={9}>
        {#each sections as section (section.id)}
          <Box tag="section" id={section.id} minHeight="24rem">
            <Prose>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </Prose>
          </Box>
        {/each}
      </Stack>
    </Column>
    <Column sm={0} md={2} lg={4}>
      <Box position="sticky" top={7}>
        <TableOfContents labelText="On this page">
          {#each sections as section (section.id)}
            <TableOfContentsItem href="#{section.id}" text={section.title} />
          {/each}
        </TableOfContents>
      </Box>
    </Column>
  </Row>
</Grid>
