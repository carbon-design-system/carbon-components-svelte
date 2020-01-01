<script>
  let className = undefined;
  export { className as class };
  export let style = undefined;
  export let vertical = false;

  import { cx } from '../../lib';
</script>

<ul
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
  class={cx('--progress', vertical && '--progress--vertical', '--skeleton', className)}
  {style}>
  {#each [0, 1, 2, 3] as item, i (item)}
    <li class={cx('--progress-step', '--progress-step--incomplete')}>
      <div class={cx('--progress-step-button', '--progress-step-button--unclickable')}>
        <svg>
          <path d="M 7, 7 m -7, 0 a 7,7 0 1,0 14,0 a 7,7 0 1,0 -14,0" />
        </svg>
        <p class={cx('--progress-label')} />
        <span class={cx('--progress-line')} />
      </div>
    </li>
  {/each}
</ul>
