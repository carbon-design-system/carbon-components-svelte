<script>
  import {
    Column,
    Content,
    Grid,
    Header,
    HeaderAction,
    HeaderPanelDivider,
    HeaderPanelLink,
    HeaderPanelLinks,
    HeaderUtilities,
    Row,
    SkipToContent,
  } from "carbon-components-svelte";
  import Help from "carbon-icons-svelte/lib/Help.svelte";
  import Notification from "carbon-icons-svelte/lib/Notification.svelte";
</script>

<Header companyName="IBM" platformName="Cloud" isSideNavOpen>
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
  <HeaderUtilities>
    <HeaderAction
      iconDescription="Notifications"
      tooltipAlignment="start"
      icon={Notification}
    >
      <HeaderPanelLinks>
        <HeaderPanelDivider>Today</HeaderPanelDivider>
        <HeaderPanelLink href="/activity">
          Cluster "mycluster-prod" was updated
        </HeaderPanelLink>
        <HeaderPanelDivider>Earlier</HeaderPanelDivider>
        <HeaderPanelLink href="/billing">
          Your monthly invoice is ready
        </HeaderPanelLink>
      </HeaderPanelLinks>
    </HeaderAction>
    <HeaderAction iconDescription="Help" icon={Help}>
      <HeaderPanelLinks>
        <HeaderPanelDivider>Support</HeaderPanelDivider>
        <HeaderPanelLink href="/docs">Documentation</HeaderPanelLink>
        <HeaderPanelDivider>Community</HeaderPanelDivider>
        <HeaderPanelLink href="/support">Open a case</HeaderPanelLink>
      </HeaderPanelLinks>
    </HeaderAction>
    <HeaderAction text="IBM Cloud">
      <HeaderPanelLinks>
        <HeaderPanelDivider>Switch product</HeaderPanelDivider>
        <HeaderPanelLink href="/watson-studio">Watson Studio</HeaderPanelLink>
      </HeaderPanelLinks>
    </HeaderAction>
  </HeaderUtilities>
</Header>

<Content>
  <Grid>
    <Row>
      <Column> <h1>Dashboard</h1> </Column>
    </Row>
  </Grid>
</Content>
