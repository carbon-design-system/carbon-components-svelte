import { render } from '@testing-library/svelte';
import Component from './Link.Story.svelte';

describe('Link', () => {
  function hasClass(element, className) {
    return element.classList.contains(className);
  }

  test('default', () => {
    const { getByText, container, rerender } = render(Component, {
      href: '#',
      inline: false,
      disabled: false
    });

    const selector = '.bx--link';
    let element = null;

    element = container.querySelector(selector);
    expect(element).toBeInTheDocument();
    expect(element.getAttribute('href')).toEqual('#');
    expect(hasClass(element, 'bx--link--inline')).toEqual(false);
    expect(hasClass(element, 'bx--link--disabled')).toEqual(false);
    expect(getByText('Link')).toBeInTheDocument();
    expect(container.innerHTML).toMatchSnapshot();

    rerender({ props: { inline: true, disabled: true } });
    element = container.querySelector(selector);
    expect(hasClass(element, 'bx--link--inline')).toEqual(true);
    expect(hasClass(element, 'bx--link--disabled')).toEqual(true);
    expect(container.innerHTML).toMatchSnapshot();
  });
});
