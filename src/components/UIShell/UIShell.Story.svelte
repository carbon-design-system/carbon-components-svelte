<script>
  export let story = undefined;

  import SettingsAdjust20 from 'carbon-icons-svelte/lib/SettingsAdjust20';
  import Help20 from 'carbon-icons-svelte/lib/Help20';
  import ChangeCatalog16 from 'carbon-icons-svelte/lib/ChangeCatalog16';
  import ManageProtection16 from 'carbon-icons-svelte/lib/ManageProtection16';
  import Notification20 from 'carbon-icons-svelte/lib/Notification20';
  import UserAvatar20 from 'carbon-icons-svelte/lib/UserAvatar20';
  import AppSwitcher20 from 'carbon-icons-svelte/lib/AppSwitcher20';

  import SideNav from './SideNav/SideNav.svelte';
  import SideNavItems from './SideNav/SideNavItems.svelte';
  import SideNavMenu from './SideNav/SideNavMenu.svelte';
  import SideNavMenuItem from './SideNav/SideNavMenuItem.svelte';
  import SideNavLink from './SideNav/SideNavLink.svelte';
  import Header from './GlobalHeader/Header.svelte';
  import HeaderNav from './GlobalHeader/HeaderNav.svelte';
  import HeaderNavItem from './GlobalHeader/HeaderNavItem.svelte';
  import HeaderNavMenu from './GlobalHeader/HeaderNavMenu.svelte';
  import HeaderUtilities from './GlobalHeader/HeaderUtilities.svelte';
  import HeaderActionSearch from './GlobalHeader/HeaderActionSearch.svelte';
  import HeaderActionLink from './GlobalHeader/HeaderActionLink.svelte';
  import HeaderAction from './GlobalHeader/HeaderAction.svelte';
  import HeaderPanelDivider from './GlobalHeader/HeaderPanelDivider.svelte';
  import HeaderPanelLink from './GlobalHeader/HeaderPanelLink.svelte';
  import HeaderPanelLinks from './GlobalHeader/HeaderPanelLinks.svelte';

  let isSideNavOpen = undefined;

  let iCatalog = {
    class: undefined,
    skeleton: false,
    render: ChangeCatalog16,
    title: 'Catalog',
    tabindex: '0',
    focusable: false,
    style: undefined
  };

  let iHelp = {
    class: undefined,
    skeleton: false,
    render: Help20,
    title: 'Help',
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

  let iSwitcher = {
    class: undefined,
    skeleton: false,
    render: AppSwitcher20,
    title: 'App Switcher',
    tabindex: '0',
    focusable: false,
    style: undefined
  };

  let iAccount = {
    class: undefined,
    skeleton: false,
    render: UserAvatar20,
    title: 'Account',
    tabindex: '0',
    focusable: false,
    style: undefined
  };

  let iNotifications = {
    class: undefined,
    skeleton: false,
    render: Notification20,
    title: 'Notifications',
    tabindex: '0',
    focusable: false,
    style: undefined
  };

  let iSettings = {
    class: undefined,
    skeleton: false,
    render: SettingsAdjust20,
    title: 'Settings',
    tabindex: '0',
    focusable: false,
    style: undefined
  };
</script>

{#if story === 'base'}
  <Header {...$$props} />
{:else if story === 'with-header-and-nav'}
  <Header {...$$props}>
    <HeaderNav>
      <HeaderNavItem href="/" text="Link 1" />
      <HeaderNavItem href="/" text="Link 2" />
      <HeaderNavItem href="/" text="Link 3" />
      <HeaderNavMenu text="Sub Menu">
        <HeaderNavItem href="/" text="Link 1" />
        <HeaderNavItem href="/" text="Link 2" />
        <HeaderNavItem href="/" text="Link 3" />
      </HeaderNavMenu>
    </HeaderNav>
  </Header>
{:else if story === 'with-utilities'}
  <Header {...$$props}>
    <HeaderUtilities>
      <HeaderActionSearch />
      <HeaderAction type="Settings" icon={iSettings}>
        <HeaderPanelLinks>
          <HeaderPanelDivider>Settings</HeaderPanelDivider>
        </HeaderPanelLinks>
      </HeaderAction>
      <HeaderActionLink type="Help" icon={iHelp} />
      <HeaderAction type="Notifications" icon={iNotifications} isOpen={true}>
        <HeaderPanelLinks>
          <HeaderPanelDivider>Notifications</HeaderPanelDivider>
        </HeaderPanelLinks>
      </HeaderAction>
      <HeaderActionLink type="Account" icon={iAccount} />
    </HeaderUtilities>
  </Header>
{:else if story === 'with-switcher'}
  <Header {...$$props}>
    <HeaderUtilities>
      <HeaderAction type="Switcher" icon={iSwitcher} isOpen={true}>
        <HeaderPanelLinks>
          <HeaderPanelDivider>Switcher subject 1</HeaderPanelDivider>
          <HeaderPanelLink>Switecher item 1</HeaderPanelLink>
          <HeaderPanelDivider>Switcher subject 2</HeaderPanelDivider>
          <HeaderPanelLink>Switecher item 1</HeaderPanelLink>
          <HeaderPanelLink>Switecher item 2</HeaderPanelLink>
          <HeaderPanelLink>Switecher item 3</HeaderPanelLink>
          <HeaderPanelLink>Switecher item 4</HeaderPanelLink>
          <HeaderPanelLink>Switecher item 5</HeaderPanelLink>
        </HeaderPanelLinks>
      </HeaderAction>
    </HeaderUtilities>
  </Header>
{:else if story === 'with-sidenav'}
  <Header bind:isSideNavOpen {...$$props} />
  <SideNav isOpen={isSideNavOpen}>
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
{/if}
