{#if $$slots.default}
  <li>
    <span>
      <slot />
    </span>
  </li>
{/if}
<hr class:bx--switcher__item--divider="{true}" />

<style>
  /**
    * Carbon does not support a divider with a subject.
    * We apply custom styles using the switcher subject divider
    * from https://carbondesignsystem.com/ as a reference.
    */

  li {
    margin: 2rem 1rem 0;
    color: #525252;
  }
  span {
    font-size: 0.75rem;
    line-height: 1.3;
    letter-spacing: 0.02rem;
    color: #c6c6c6;
  }
</style>
