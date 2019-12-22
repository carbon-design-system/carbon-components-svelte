import { withKnobs, text, select, boolean } from '@storybook/addon-knobs';
import Component from './RadioButtonGroup.Story.svelte';

export default { title: 'RadioButtonGroup', decorators: [withKnobs] };

const values = {
  standard: 'standard',
  'default-selected': 'default-selected',
  disabled: 'disabled'
};

const orientations = {
  'Horizontal (horizontal)': 'horizontal',
  'Vertical (vertical)': 'vertical'
};

const labelPositions = {
  'Left (left)': 'left',
  'Right (right)': 'right'
};

export const Default = () => ({
  Component,
  props: {
    group: {
      name: text('The form control name (name in <RadioButtonGroup>)', 'radio-button-group'),
      valueSelected: select(
        'Value of the selected button (valueSelected in <RadioButtonGroup>)',
        values,
        'default-selected'
      ),
      orientation: select('Radio button orientation (orientation)', orientations, 'horizontal'),
      labelPosition: select('Label position (labelPosition)', labelPositions, 'right')
    },
    radio: {
      disabled: boolean('Disabled (disabled in <RadioButton>)', false),
      labelText: text('Label text (labelText in <RadioButton>)', 'Radio button label')
    }
  }
});
