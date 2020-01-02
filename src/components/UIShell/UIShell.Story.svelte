<script>
  export let story = undefined;

  import UIShell from './UIShell.svelte';
  import FormTest from './FormTest.svelte';
  import Notification20 from 'carbon-icons-svelte/lib/Notification20';
  import UserAvatar20 from 'carbon-icons-svelte/lib/UserAvatar20';

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

    action: will be place on the aria-label, use to identify the action from the others.

    type: search-> will open an inputText to start a search.

          component-> when specifying this property, content will expect a .svelte file.

          link-> when specifying this property, content will expect for subject objects that will contain href and link.
    
    icon: you need to specify the properties specified in carbon-icons-svelte components as shown in the example below.

    content: what will be shown on the component, could vary the information depending on the type property.

    *** actions 'search' and 'switcher' doesnt need to specify type and icon because those are predefined actions in the component.
  */
  const rightPanel = [
    {
      action: 'search'
    },
    {
      action: 'userlogin',
      type: 'component',
      icon: [
        {
          class: undefined,
          skeleton: false,
          render: Notification20,
          title: 'Notification20',
          tabIndex: 0,
          focusable: false,
          style: undefined
        }
      ],
      content: FormTest
    },
    {
      action: 'switcher',
      content: [
        {
          subjet: 'Switcher theme 1',
          items: [
            {
              href: '#',
              text: 'Switcher item 1'
            }
          ]
        },
        {
          subjet: 'Switcher theme 2',
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
          subjet: 'Switcher theme 3',
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
      ]
    },
    {
      action: 'userlogin',
      type: 'component',
      icon: [
        {
          class: undefined,
          skeleton: false,
          render: UserAvatar20,
          title: 'UserAvatar20',
          tabIndex: 0,
          focusable: false,
          style: undefined
        }
      ],
      content: FormTest
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
