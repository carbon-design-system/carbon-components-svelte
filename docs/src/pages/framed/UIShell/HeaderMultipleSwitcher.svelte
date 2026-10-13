<script>
  import {
    Column,
    Content,
    Grid,
    Header,
    HeaderAction,
    HeaderPanelGroup,
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
        <HeaderPanelGroup label="Today">
          <HeaderPanelLink href="/activity">
            Cluster "mycluster-prod" was updated
          </HeaderPanelLink>
        </HeaderPanelGroup>
        <HeaderPanelGroup label="Earlier">
          <HeaderPanelLink href="/billing">
            Your monthly invoice is ready
          </HeaderPanelLink>
        </HeaderPanelGroup>
      </HeaderPanelLinks>
    </HeaderAction>
    <HeaderAction iconDescription="Help" icon={Help}>
      <HeaderPanelLinks>
        <HeaderPanelGroup label="Support">
          <HeaderPanelLink href="/docs">Documentation</HeaderPanelLink>
        </HeaderPanelGroup>
        <HeaderPanelGroup label="Community">
          <HeaderPanelLink href="/support">Open a case</HeaderPanelLink>
        </HeaderPanelGroup>
      </HeaderPanelLinks>
    </HeaderAction>
    <HeaderAction text="IBM Cloud">
      <HeaderPanelLinks>
        <HeaderPanelGroup label="Switch product">
          <HeaderPanelLink href="/watson-studio">Watson Studio</HeaderPanelLink>
        </HeaderPanelGroup>
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
