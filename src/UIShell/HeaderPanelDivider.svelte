{#if $$slots.default}
  <li class:bx--header-panel-divider={true}>
    <slot />
  </li>
{/if}
<hr class:bx--switcher__item--divider="{true}" />

<style>
  /**
    * Carbon does not support a divider with a subject.
    * We apply custom styles using the switcher subject divider
    * from https://carbondesignsystem.com/ as a reference.
    */

  :global(.bx--header-panel-divider) {
    margin: 2rem 1rem 0;
    font-size: 0.75rem;
    line-height: 1.3;
    letter-spacing: 0.02rem;
    color: #c6c6c6;
  }
</style>
