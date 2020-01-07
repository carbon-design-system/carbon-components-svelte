<script>
  export let story = undefined;

  import UIShell from './UIShell.svelte';
  import FormTest from './FormTest.svelte';
  import SettingsAdjust20 from 'carbon-icons-svelte/lib/SettingsAdjust20';
  import { leftPanelActions, leftPanelTypes } from './constants';

  const navMenu = [
    {
      href: '#',
      text: 'Link 1',
      subMenu: undefined
    },
    {
      href: '#',
      text: 'Link 2',
      subMenu: undefined
    },
    {
      href: '#',
      text: 'Link 3',
      subMenu: undefined
    },
    {
      href: undefined,
      text: 'Link 4',
      subMenu: [
        {
          href: '#',
          text: 'Sub-link 1'
        },
        {
          href: '#',
          text: 'Sub-link 2'
        },
        {
          href: '#',
          text: 'Sub-link 3'
        }
      ]
    }
  ];

  /*
    Format:

    action: will be place on the aria-label, use to identify the action from the others. Predifined actions: 'search', 'help', 'notification', 'account', 'switcher'

    type: search-> will open an inputText to start a search.

          component-> when specifying this property, content will expect a .svelte file.

          link-> when specifying this property, content will expect for just 1 href and text

          links-> when specifying this property, content will expect for an array of objects with property subject and another array of objects with href and text
    
    icon: you need to specify the properties specified in carbon-icons-svelte components as shown in the example below.

    content: what will be shown on the component, could vary the information depending on the type property.

    *** actions 'search' and 'switcher' doesnt need to specify type and icon because those are predefined actions in the component.
  */
  const rightPanel = [
    {
      action: leftPanelActions.search.actionString,
      type: leftPanelTypes.search,
      isVisible: true
    },
    { 
      action: 'customsettings',
      type: leftPanelTypes.component,
      icon: [
        {
          class: undefined,
          skeleton: false,
          render: SettingsAdjust20,
          title: 'settings',
          tabIndex: 0,
          focusable: false,
          style: undefined
        }
      ],
      content: FormTest,
      isVisible: true
    },
    {
      action: leftPanelActions.help.actionString,
      type: leftPanelTypes.link,
      content: {
        href: '#',
        text: leftPanelActions.help.actionString
      },
      isVisible: true
    },
    {
      action: leftPanelActions.notifications.actionString,
      type: leftPanelTypes.links,
      content: [
        {
          subjet: 'Notification subjet 1',
          items: [
            {
              href: '#',
              text: 'Notification item 1'
            }
          ]
        },
        {
          subjet: 'Notification subjet 2',
          items: [
            {
              href: '#',
              text: 'Notification item 1'
            },
            {
              href: '#',
              text: 'Notification item 2'
            },
            {
              href: '#',
              text: 'Notification item 3'
            },
            {
              href: '#',
              text: 'Notification item 4'
            }
          ]
        }
      ],
      isVisible: true
    },
    {
      action: leftPanelActions.switcher.actionString,
      type: leftPanelTypes.links,
      content: [
        {
          subjet: 'Switcher subjet 1',
          items: [
            {
              href: '#',
              text: 'Switcher item 1'
            }
          ]
        },
        {
          subjet: 'Switcher subjet 2',
          items: [
            {
              href: '#',
              text: 'Switcher item 1'
            },
            {
              href: '#',
              text: 'Switcher item 2'
            },
            {
              href: '#',
              text: 'Switcher item 3'
            },
            {
              href: '#',
              text: 'Switcher item 4'
            }
          ]
        },
        {
          subjet: 'Switcher subjet 3',
          items: [
            {
              href: '#',
              text: 'Switcher item 1'
            },
            {
              href: '#',
              text: 'Switcher item 2'
            }
          ]
        }
      ],
      isVisible: true
    },
    {
      action: leftPanelActions.account.actionString,
      type: leftPanelTypes.link,
      content: {
        href: '#',
        text: leftPanelActions.account.actionString
      },
      isVisible: true
    }
  ];
</script>

{#if story === 'with-nav'}
  <UIShell {...$$props} {navMenu} />
{:else if story === 'with-actions'}
  <UIShell {...$$props} {rightPanel} />
{:else}
  <UIShell {...$$props} />
{/if}
