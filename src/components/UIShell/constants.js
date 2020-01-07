import Search20 from 'carbon-icons-svelte/lib/Search20';
import Help20 from 'carbon-icons-svelte/lib/Help20';
import Notification20 from 'carbon-icons-svelte/lib/Notification20';
import UserAvatar20 from 'carbon-icons-svelte/lib/UserAvatar20';
import AppSwitcher20 from 'carbon-icons-svelte/lib/AppSwitcher20';
import Close20 from 'carbon-icons-svelte/lib/Close20';

export const leftPanelActions = {
  search: {
    actionString: 'Search',
    iconProps: {
      class: undefined,
      skeleton: false,
      render: Search20,
      title: 'Search',
      tabIndex: 0,
      focusable: false,
      style: undefined
    }
  },
  help: {
    actionString: 'Help',
    iconProps: {
      class: undefined,
      skeleton: false,
      render: Help20,
      title: 'Help',
      tabIndex: 0,
      focusable: false,
      style: undefined
    }
  },
  notifications: {
    actionString: 'Notifications',
    iconProps: {
      class: undefined,
      skeleton: false,
      render: Notification20,
      title: 'Notifications',
      tabIndex: 0,
      focusable: false,
      style: undefined
    }
  },
  account: {
    actionString: 'Account',
    iconProps: {
      class: undefined,
      skeleton: false,
      render: UserAvatar20,
      title: 'Account',
      tabIndex: 0,
      focusable: false,
      style: undefined
    }
  },
  switcher: {
    actionString: 'Switcher',
    iconProps: {
      class: undefined,
      skeleton: false,
      render: AppSwitcher20,
      title: 'App Switcher',
      tabIndex: 0,
      focusable: false,
      style: undefined
    }
  }
};

export const leftPanelTypes = {
  search: 'Search',
  component: 'Component',
  link: 'Link',
  links: 'Links'
};

export const closeIcon = {
  class: undefined,
  skeleton: false,
  render: Close20,
  title: 'Close',
  tabIndex: 0,
  focusable: false,
  style: undefined
};
