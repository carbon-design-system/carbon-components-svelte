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

  let isOpen1 = false;
  let isOpen2 = false;
  let isOpen3 = false;
</script>

<Header companyName="IBM" platformName="Cloud" isSideNavOpen>
  <svelte:fragment slot="skipToContent"> <SkipToContent /> </svelte:fragment>
  <HeaderUtilities>
    <HeaderAction
      bind:isOpen={isOpen1}
      iconDescription="Notifications"
      tooltipAlignment="start"
      icon={Notification}
      on:open={() => {
        isOpen2 = false;
        isOpen3 = false;
      }}
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
    <HeaderAction
      bind:isOpen={isOpen2}
      iconDescription="Help"
      icon={Help}
      on:open={() => {
        isOpen1 = false;
        isOpen3 = false;
      }}
    >
      <HeaderPanelLinks>
        <HeaderPanelDivider>Support</HeaderPanelDivider>
        <HeaderPanelLink href="/docs">Documentation</HeaderPanelLink>
        <HeaderPanelDivider>Community</HeaderPanelDivider>
        <HeaderPanelLink href="/support">Open a case</HeaderPanelLink>
      </HeaderPanelLinks>
    </HeaderAction>
    <HeaderAction
      bind:isOpen={isOpen3}
      text="IBM Cloud"
      on:open={() => {
        isOpen1 = false;
        isOpen2 = false;
      }}
    >
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
