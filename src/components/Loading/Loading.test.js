import { render } from '@testing-library/svelte';
import Component from './Loading.svelte';

test('Loading', () => {
  const { container, rerender } = render(Component);

  let element = container.querySelector('.bx--loading-overlay');

  expect(element).toBeInTheDocument();
  expect(element).not.toHaveClass('bx--loading-overlay--stop');
  expect(element.querySelector('.bx--loading__stroke')).toHaveAttribute('r', '37.5');

  rerender({ props: { active: false, small: true, withOverlay: false } });

  element = container.querySelector('.bx--loading');
  expect(element).toHaveClass('bx--loading--small', 'bx--loading--stop');
  expect(element.querySelector('.bx--loading__background')).toHaveAttribute('r', '26.8125');
});
