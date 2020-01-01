import { render } from '@testing-library/svelte';
import Component from './Link.Story.svelte';

test('Link', () => {
  const { container, rerender } = render(Component, {
    href: '#',
    inline: false,
    disabled: false
  });

  const selector = '.bx--link';
  let element = null;

  element = container.querySelector(selector);
  expect(element).toHaveAttribute('href', '#');
  expect(element).not.toHaveClass('bx--link--inline', 'bx--link--disabled');
  expect(element).toHaveTextContent('Link');

  rerender({ props: { inline: true, disabled: true } });

  element = container.querySelector(selector);
  expect(element).toHaveClass('bx--link--inline', 'bx--link--disabled');
});
