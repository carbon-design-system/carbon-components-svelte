<script>
  import {
    Column,
    Content,
    Grid,
    Header,
    HeaderNav,
    HeaderNavItem,
    HeaderNavMenu,
    Row,
    SkipToContent,
    Tag,
  } from "carbon-components-svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";
</script>

<Header companyName="IBM" platformName="Cloud">
  <svelte:fragment slot="skipToContent"><SkipToContent /></svelte:fragment>
  <HeaderNav>
    <HeaderNavItem href="/catalog" text="Catalog" isSelected />
    <HeaderNavItem href="/resources" text="Resources" />
    <HeaderNavMenu text="Manage" icon={Settings}>
      <HeaderNavItem href="/account" text="Account" />
      <HeaderNavItem href="/billing" text="Billing" />
      <HeaderNavItem href="/access" text="Access (IAM)" />
    </HeaderNavMenu>
    <HeaderNavMenu>
      <svelte:fragment slot="textChildren">
        Products <Tag size="sm" type="blue">New</Tag>
      </svelte:fragment>
      <HeaderNavItem href="/watson" text="Watson Studio" />
      <HeaderNavItem href="/quantum" text="Quantum" />
    </HeaderNavMenu>
  </HeaderNav>
</Header>

<Content>
  <Grid>
    <Row>
      <Column>
        <h1>Navigation menu triggers</h1>
        <p>
          Press Tab to reach the navigation, then use the arrow keys, Home, End,
          or type a letter to move between items.
        </p>
      </Column>
    </Row>
  </Grid>
</Content>
