<script>
  export let story = undefined;
  const { labelText, indeterminate, disabled, hideLabel, wrapperClassName } = $$props;

  import { cx } from '../../lib';
  import Layout from '../../internal/ui/Layout.svelte';
  import Checkbox from './Checkbox.svelte';
  import CheckboxSkeleton from './Checkbox.Skeleton.svelte';

  const checkboxProps = {
    labelText,
    indeterminate,
    disabled,
    hideLabel,
    wrapperClassName
  };
</script>

<Layout>
  {#if story === 'skeleton'}
    <CheckboxSkeleton />
  {:else if story === 'unchecked'}
    <fieldset class={cx('--fieldset')}>
      <legend class={cx('--label')}>Checkbox heading</legend>
      <Checkbox {...checkboxProps} id="checkbox-label-1" />
      <Checkbox {...checkboxProps} id="checkbox-label-2" />
    </fieldset>
  {:else}
    <fieldset class={cx('--fieldset')}>
      <legend class={cx('--label')}>Checkbox heading</legend>
      <Checkbox {...checkboxProps} checked id="checkbox-label-1" />
      <Checkbox {...checkboxProps} checked id="checkbox-label-2" />
    </fieldset>
  {/if}
</Layout>
