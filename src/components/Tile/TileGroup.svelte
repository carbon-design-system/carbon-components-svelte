<script>
  let className = undefined;
  export { className as class };
  export let disabled = false;
  export let legend = '';
  export let style = undefined;

  import { cx } from '../../lib';

  const _class = cx('--tile-group', className);
</script>

<fieldset class={_class} {disabled} {style}>
  {#if legend}
    <legend>{legend}</legend>
  {/if}
  <div>
    <slot />
  </div>
</fieldset>
