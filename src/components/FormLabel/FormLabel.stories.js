import { withKnobs } from '@storybook/addon-knobs';
import Component from './FormLabel.Story.svelte';

export default { title: 'FormLabel', decorators: [withKnobs] };

export const Default = () => ({ Component });

export const WithTooltip = () => ({ Component, props: { story: 'tooltip' } });
