<script>
  export let story = undefined;
  const { light, feedback, copyLabel, copyButtonDescription, showLessText, showMoreText } = $$props;

  import Layout from '../../internal/ui/Layout.svelte';
  import CodeSnippet from './CodeSnippet.svelte';
  import CodeSnippetSkeleton from './CodeSnippet.Skeleton.svelte';

  const inlineProps = { light, feedback, copyLabel };
  const singleLineProps = {
    feedback,
    copyButtonDescription,
    'aria-label': $$props['aria-label']
  };
  const multiLineProps = { feedback, showLessText, showMoreText };
</script>

<Layout>
  <div>
    {#if story === 'skeleton'}
      <div style="width: 800px">
        <CodeSnippetSkeleton type="single" props={{ style: 'margin-bottom: 8px' }} />
        <CodeSnippetSkeleton type="multi" />
      </div>
    {:else if story === 'inline'}
      <CodeSnippet type="inline" {...inlineProps}>{'node -v'}</CodeSnippet>
    {:else if story === 'single line'}
      <CodeSnippet type="single" {...singleLineProps}>
        {'node -v Lorem ipsum dolor sit amet, consectetur adipisicing elit. Blanditiis, veritatis voluptate id incidunt molestiae officia possimus, quasi itaque alias, architecto hic, dicta fugit? Debitis delectus quidem explicabo vitae fuga laboriosam!'}
      </CodeSnippet>
    {:else if story === 'multi line'}
      <CodeSnippet type="multi" {...multiLineProps}>
        {`@mixin grid-container {
  width: 100%;
  padding-right: padding(mobile);
  padding-left: padding(mobile);

  @include breakpoint(bp--xs--major) {
    padding-right: padding(xs);
    padding-left: padding(xs);
  }
}

$z-indexes: (
  modal : 9000,
  overlay : 8000,
  dropdown : 7000,
  header : 6000,
  footer : 5000,
  hidden : - 1,
  overflowHidden: - 1,
  floating: 10000
);`}
      </CodeSnippet>
    {/if}
  </div>
</Layout>
