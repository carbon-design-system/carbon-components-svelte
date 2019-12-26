import { withKnobs, select, text, boolean } from '@storybook/addon-knobs';
import Component from './OverflowMenu.Story.svelte';

export default { title: 'OverflowMenu', decorators: [withKnobs] };

const directions = {
  'Bottom of the trigger button (bottom)': 'bottom',
  'Top of the trigger button (top)': 'top'
};

export const Default = () => ({
  Component,
  props: {
    menu: {
      direction: select('Menu direction (direction)', directions, 'bottom'),
      ariaLabel: text('ARIA label (ariaLabel)', 'Menu'),
      iconDescription: text('Icon description (iconDescription)', ''),
      flipped: boolean('Flipped (flipped)', false),
      light: boolean('Light (light)', false)
    },
    menuItem: {
      disabled: boolean('Disabled (disabled)', false),
      requireTitle: boolean('Use hover over text for menu item (requireTitle)', false)
    }
  }
});

export const WithLinks = () => ({
  Component,
  props: {
    story: 'links',
    menu: {
      direction: select('Menu direction (direction)', directions, 'bottom'),
      ariaLabel: text('ARIA label (ariaLabel)', 'Menu'),
      iconDescription: text('Icon description (iconDescription)', ''),
      flipped: boolean('Flipped (flipped)', false),
      light: boolean('Light (light)', false)
    },
    menuItem: {
      disabled: boolean('Disabled (disabled)', false),
      requireTitle: boolean('Use hover over text for menu item (requireTitle)', false)
    }
  }
});

export const CustomTrigger = () => ({
  Component,
  props: {
    story: 'trigger',
    menu: {
      direction: select('Menu direction (direction)', directions, 'bottom'),
      ariaLabel: text('ARIA label (ariaLabel)', 'Menu'),
      iconDescription: text('Icon description (iconDescription)', ''),
      flipped: boolean('Flipped (flipped)', false),
      light: boolean('Light (light)', false)
    },
    menuItem: {
      disabled: boolean('Disabled (disabled)', false),
      requireTitle: boolean('Use hover over text for menu item (requireTitle)', false)
    }
  }
});
