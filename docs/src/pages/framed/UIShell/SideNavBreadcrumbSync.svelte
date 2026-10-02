<script>
  import {
    Breadcrumb,
    BreadcrumbItem,
    Column,
    Content,
    Grid,
    Row,
    SideNav,
    SideNavItems,
    SideNavLink,
    SideNavMenu,
    SideNavMenuItem,
  } from "carbon-components-svelte";

  const trail = [
    { id: "kubernetes", href: "/kubernetes", text: "Kubernetes" },
    { id: "clusters", href: "/kubernetes/clusters", text: "Clusters" },
  ];

  const activeId = trail[trail.length - 1].id;
</script>

<Breadcrumb>
  {#each trail as step, index (step.id)}
    <BreadcrumbItem href={step.href} isCurrentPage={index === trail.length - 1}>
      {step.text}
    </BreadcrumbItem>
  {/each}
</Breadcrumb>

<SideNav>
  <SideNavItems>
    <SideNavLink href="/dashboard" text="Dashboard" />
    <SideNavMenu text="Kubernetes">
      <SideNavMenuItem
        href="/kubernetes/clusters"
        text="Clusters"
        isSelected={activeId === "clusters"}
      />
      <SideNavMenuItem href="/kubernetes/worker-pools" text="Worker pools" />
      <SideNavMenuItem href="/kubernetes/registry" text="Container registry" />
    </SideNavMenu>
  </SideNavItems>
</SideNav>

<Content>
  <Grid>
    <Row>
      <Column> <h1>Clusters</h1> </Column>
    </Row>
  </Grid>
</Content>
