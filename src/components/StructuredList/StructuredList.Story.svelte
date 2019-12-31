<script>
  export let story = undefined;

  import CheckmarkFilled16 from 'carbon-icons-svelte/lib/CheckmarkFilled16';
  import Layout from '../../internal/ui/Layout.svelte';
  import { cx } from '../../lib';
  import StructuredListBody from './StructuredListBody.svelte';
  import StructuredListCell from './StructuredListCell.svelte';
  import StructuredListHead from './StructuredListHead.svelte';
  import StructuredListInput from './StructuredListInput.svelte';
  import StructuredListRow from './StructuredListRow.svelte';
  import StructuredListSkeleton from './StructuredList.Skeleton.svelte';
  import StructuredList from './StructuredList.svelte';

  let selected = 'row-1-value';
</script>

<Layout>
  <div>
    {#if story === 'skeleton'}
      <div style="width: 800px">
        <StructuredListSkeleton />
      </div>
    {:else if story === 'selection'}
      <StructuredList selection border bind:selected>
        <StructuredListHead>
          <StructuredListRow head>
            <StructuredListCell head>ColumnA</StructuredListCell>
            <StructuredListCell head>ColumnB</StructuredListCell>
            <StructuredListCell head>ColumnC</StructuredListCell>
            <StructuredListCell head>{''}</StructuredListCell>
          </StructuredListRow>
        </StructuredListHead>
        <StructuredListBody>
          {#each [0, 1, 2, 3] as item, i (item)}
            <StructuredListRow label for={`row-${i}`}>
              <StructuredListCell>Row {i}</StructuredListCell>
              <StructuredListCell>Row {i}</StructuredListCell>
              <StructuredListCell>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc dui magna, finibus id
                tortor sed, aliquet bibendum augue. Aenean posuere sem vel euismod dignissim. Nulla
                ut cursus dolor. Pellentesque vulputate nisl a porttitor interdum.
              </StructuredListCell>
              <StructuredListInput
                id={`row-${i}`}
                value={`row-${i}-value`}
                title={`row-${i}-title`}
                name={`row-${i}-name`} />
              <StructuredListCell>
                <CheckmarkFilled16
                  class={cx('--structured-list-svg')}
                  aria-label="select an option"
                  title="select an option" />
              </StructuredListCell>
            </StructuredListRow>
          {/each}
        </StructuredListBody>
      </StructuredList>
    {:else}
      <StructuredList>
        <StructuredListHead>
          <StructuredListRow head>
            <StructuredListCell head>ColumnA</StructuredListCell>
            <StructuredListCell head>ColumnB</StructuredListCell>
            <StructuredListCell head>ColumnC</StructuredListCell>
          </StructuredListRow>
        </StructuredListHead>
        <StructuredListBody>
          <StructuredListRow>
            <StructuredListCell noWrap>Row 1</StructuredListCell>
            <StructuredListCell>Row 1</StructuredListCell>
            <StructuredListCell>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc dui magna, finibus id
              tortor sed, aliquet bibendum augue. Aenean posuere sem vel euismod dignissim. Nulla ut
              cursus dolor. Pellentesque vulputate nisl a porttitor interdum.
            </StructuredListCell>
          </StructuredListRow>
          <StructuredListRow>
            <StructuredListCell noWrap>Row 2</StructuredListCell>
            <StructuredListCell>Row 2</StructuredListCell>
            <StructuredListCell>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc dui magna, finibus id
              tortor sed, aliquet bibendum augue. Aenean posuere sem vel euismod dignissim. Nulla ut
              cursus dolor. Pellentesque vulputate nisl a porttitor interdum.
            </StructuredListCell>
          </StructuredListRow>
        </StructuredListBody>
      </StructuredList>
    {/if}
  </div>
</Layout>
