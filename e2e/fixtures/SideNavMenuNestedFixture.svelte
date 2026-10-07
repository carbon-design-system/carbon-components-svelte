<script>
  import SideNav from "carbon-components-svelte/UIShell/SideNav.svelte";
  import SideNavItems from "carbon-components-svelte/UIShell/SideNavItems.svelte";
  import SideNavLink from "carbon-components-svelte/UIShell/SideNavLink.svelte";
  import SideNavMenu from "carbon-components-svelte/UIShell/SideNavMenu.svelte";
  import SideNavMenuItem from "carbon-components-svelte/UIShell/SideNavMenuItem.svelte";
  import Application from "carbon-icons-svelte/lib/Application.svelte";
  import DataBase from "carbon-icons-svelte/lib/DataBase.svelte";
  import Kubernetes from "carbon-icons-svelte/lib/Kubernetes.svelte";
  import Renew from "carbon-icons-svelte/lib/Renew.svelte";
</script>

<SideNav ariaLabel="Side navigation" fixed isOpen>
  <SideNavItems>
    <SideNavMenu icon={Kubernetes} text="Kubernetes" expanded>
      <SideNavMenuItem href="#" text="Clusters" />
      <SideNavMenu icon={Application} text="Workloads" expanded>
        <SideNavMenuItem href="#" text="Pods" />
        <SideNavMenu text="Controllers" expanded>
          <SideNavMenuItem href="#" text="Deployments" />
        </SideNavMenu>
      </SideNavMenu>
      <SideNavLink icon={Renew} href="#" text="Rollouts" />
    </SideNavMenu>
    <SideNavMenu text="Storage" expanded>
      <SideNavMenuItem href="#" text="Volumes" />
      <SideNavMenu text="Backups" expanded>
        <DataBase slot="icon" />
        <SideNavMenuItem href="#" text="Schedules" />
      </SideNavMenu>
    </SideNavMenu>
    <SideNavMenu large text="Compute" expanded>
      <SideNavMenuItem href="#" text="Instances" />
      <SideNavMenu text="Images" expanded>
        <SideNavMenuItem href="#" text="Snapshots" />
        <SideNavLink large href="#" text="Custom image" />
      </SideNavMenu>
    </SideNavMenu>
  </SideNavItems>
</SideNav>
