<script>
  import {
    Column,
    Grid,
    Prose,
    Row,
    TableOfContents,
    TableOfContentsItem,
  } from "carbon-components-svelte";

  const sections = [
    {
      id: "overview",
      title: "Overview",
      body: "Checkout v2 replaces the three-page flow with a single page that saves progress as the shopper types.",
    },
    {
      id: "measures-of-success",
      title: "Measures of success",
      body: "Conversion, time to purchase, and support tickets tagged “checkout”, compared with the four weeks before launch.",
    },
    {
      id: "key-moments",
      title: "Key moments",
      body: "Address autocomplete, the saved-card prompt, and the order summary are where most shoppers stall today.",
    },
    {
      id: "tutorials",
      title: "Tutorials",
      body: "Step-by-step guides for enabling express payment methods and migrating saved addresses.",
    },
    {
      id: "articles",
      title: "Articles",
      body: "Background reading on form design and reducing checkout abandonment.",
    },
  ];
</script>

<Grid>
  <Row>
    <Column sm={0} md={2} lg={4}>
      <div style="position: sticky; top: 2rem">
        <TableOfContents>
          {#each sections as section (section.id)}
            <TableOfContentsItem href="#{section.id}" text={section.title} />
          {/each}
        </TableOfContents>
      </div>
    </Column>
    <Column sm={4} md={6} lg={12}>
      <Prose>
        {#each sections as section (section.id)}
          <section id={section.id} style="min-height: 24rem">
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        {/each}
      </Prose>
    </Column>
  </Row>
</Grid>
