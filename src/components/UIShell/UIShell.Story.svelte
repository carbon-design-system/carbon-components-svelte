<script>
  export let story = undefined;

  import UIShell from './UIShell.svelte';
  import SettingsAdjust20 from 'carbon-icons-svelte/lib/SettingsAdjust20';
  import ChangeCatalog16 from 'carbon-icons-svelte/lib/ChangeCatalog16';
  import ManageProtection16 from 'carbon-icons-svelte/lib/ManageProtection16';

  import SideNav from './SideNav/SideNav.svelte';
  import SideNavItems from './SideNav/SideNavItems.svelte';
  import SideNavMenu from './SideNav/SideNavMenu.svelte';
  import SideNavMenuItem from './SideNav/SideNavMenuItem.svelte';
  import SideNavLink from './SideNav/SideNavLink.svelte';
  import UIShellNav from './UIShellNav/UIShellNav.svelte';
  import UIShellNavItem from './UIShellNav/UIShellNavItem.svelte';
  import UIShellNavSubmenu from './UIShellNav/UIShellNavSubmenu.svelte';

  let iCatalog = {
    class: undefined,
    skeleton: false,
    render: ChangeCatalog16,
    title: 'Catalog',
    tabindex: '0',
    focusable: false,
    style: undefined
  };

  let iAdjust = {
    class: undefined,
    skeleton: false,
    render: SettingsAdjust20,
    title: 'Catalog',
    tabindex: '0',
    focusable: false,
    style: undefined
  };

  let iProtection = {
    class: undefined,
    skeleton: false,
    render: ManageProtection16,
    title: 'Catalog',
    tabindex: '0',
    focusable: false,
    style: undefined
  };
</script>

{#if story === 'with-nav'}
  <UIShell {...$$props}>
    <div slot="Nav">
      <UIShellNav>
        <UIShellNavItem href="/" text="Link 1" />
        <UIShellNavItem href="/" text="Link 2" />
        <UIShellNavItem href="/" text="Link 3" />
        <UIShellNavSubmenu text="Sub Menu">
          <UIShellNavItem href="/" text="Link 1" />
          <UIShellNavItem href="/" text="Link 2" />
          <UIShellNavItem href="/" text="Link 3" />
        </UIShellNavSubmenu>
      </UIShellNav>
    </div>
  </UIShell>
{:else if story === 'with-actions-sidenav'}
  <UIShell {...$$props}>
    <div slot="SideNav">
      <SideNav>
        <SideNavItems>
          <SideNavMenu text="Menu 01" icon={iCatalog}>
            <SideNavMenuItem text="Sub 01" href="/" />
            <SideNavMenuItem text="Sub 02" href="/" />
            <SideNavMenuItem text="Sub 03" href="/" />
            <SideNavMenuItem text="Sub 04" href="/" />
          </SideNavMenu>
          <SideNavMenu text="Menu 02" icon={iAdjust}>
            <SideNavMenuItem text="Sub 01" href="/" />
            <SideNavMenuItem text="Sub 02" href="/" />
            <SideNavMenuItem text="Sub 03" href="/" />
            <SideNavMenuItem text="Sub 04" href="/" />
          </SideNavMenu>
          <SideNavLink text="Menu 03" href="/" icon={iProtection} />
        </SideNavItems>
      </SideNav>
    </div>
  </UIShell>
{:else}
  <UIShell {...$$props} />
{/if}
