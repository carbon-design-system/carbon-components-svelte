<script>
  import Layout from '../../internal/ui/Layout.svelte';
  import Button from '../Button';
  import Modal from './Modal.svelte';

  let open = $$props.open;
</script>

<Layout>
  <div>
    <Button
      on:click={() => {
        open = true;
      }}>
      Launch modal
    </Button>
  </div>
  <Modal
    {...$$props}
    bind:open
    on:click:button--secondary={() => {
      console.log('click button secondary');
    }}
    on:open={() => {
      console.log('open');
    }}
    on:close={() => {
      console.log('close');
    }}
    on:submit={() => {
      console.log('submit');
    }}>
    <p>
      This component supports two-way binding by default. Please see ComposedModal for piecemeal
      functionality.
    </p>
    {#if $$props.hasScrollingContent}
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean id accumsan augue. Phasellus
        consequat augue vitae tellus tincidunt posuere. Curabitur justo urna, consectetur vel elit
        iaculis, ultrices condimentum risus. Nulla facilisi. Etiam venenatis molestie tellus.
        Quisque consectetur non risus eu rutrum.{' '}
      </p>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean id accumsan augue. Phasellus
        consequat augue vitae tellus tincidunt posuere. Curabitur justo urna, consectetur vel elit
        iaculis, ultrices condimentum risus. Nulla facilisi. Etiam venenatis molestie tellus.
        Quisque consectetur non risus eu rutrum.{' '}
      </p>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean id accumsan augue. Phasellus
        consequat augue vitae tellus tincidunt posuere. Curabitur justo urna, consectetur vel elit
        iaculis, ultrices condimentum risus. Nulla facilisi. Etiam venenatis molestie tellus.
        Quisque consectetur non risus eu rutrum.{' '}
      </p>
      <h3>Lorem ipsum</h3>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean id accumsan augue. Phasellus
        consequat augue vitae tellus tincidunt posuere. Curabitur justo urna, consectetur vel elit
        iaculis, ultrices condimentum risus. Nulla facilisi. Etiam venenatis molestie tellus.
        Quisque consectetur non risus eu rutrum.{' '}
      </p>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean id accumsan augue. Phasellus
        consequat augue vitae tellus tincidunt posuere. Curabitur justo urna, consectetur vel elit
        iaculis, ultrices condimentum risus. Nulla facilisi. Etiam venenatis molestie tellus.
        Quisque consectetur non risus eu rutrum.{' '}
      </p>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean id accumsan augue. Phasellus
        consequat augue vitae tellus tincidunt posuere. Curabitur justo urna, consectetur vel elit
        iaculis, ultrices condimentum risus. Nulla facilisi. Etiam venenatis molestie tellus.
        Quisque consectetur non risus eu rutrum.{' '}
      </p>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean id accumsan augue. Phasellus
        consequat augue vitae tellus tincidunt posuere. Curabitur justo urna, consectetur vel elit
        iaculis, ultrices condimentum risus. Nulla facilisi. Etiam venenatis molestie tellus.
        Quisque consectetur non risus eu rutrum.{' '}
      </p>
    {/if}
  </Modal>
</Layout>
