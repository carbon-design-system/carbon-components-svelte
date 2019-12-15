import { configure } from '@storybook/svelte';

// use prebuilt CSS file to refrain from setting up sass, autoprefixer
import '!style-loader!css-loader!carbon-components/css/carbon-components.min.css';

configure(require.context('../src', true, /\.stories\.js$/), module);
