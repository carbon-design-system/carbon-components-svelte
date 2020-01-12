<script>
  export let href = undefined;
  export let kind = 'launch';
  export let iconLeft = undefined;
  export let iconRight = Launch20;

  import Launch20 from 'carbon-icons-svelte/lib/Launch20';
  import ArrowRight20 from 'carbon-icons-svelte/lib/ArrowRight20';

  $: iconRight = kind === 'link' ? ArrowRight20 : Launch20;
</script>

<style>
  .link {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 1rem;
    cursor: pointer;
    border-right: 1px solid transparent;
    border-bottom: 1px solid transparent;
  }

  @media screen and (max-width: 671px) {
    .link {
      border-right: 0;
    }
  }

  .link:focus {
    outline: 2px solid var(--cds-focus, #0f62fe);
    outline-offset: -2px;
  }

  .icon {
    position: absolute;
    bottom: 1rem;
    fill: var(--cds-ui-05);
  }

  .icon--left {
    left: 1rem;
  }

  .icon--right {
    right: 1rem;
  }

  .bg {
    position: absolute;
    z-index: -1;
    right: 1px;
    bottom: 1px;
    width: calc(100% - 1px);
    height: calc(100% - 1px);
    transition: 150ms cubic-bezier(0.2, 0, 0.38, 0.9);
    background-color: var(--cds-ui-01);
  }

  .button-tile:hover .bg {
    background-color: var(--cds-ui-03);
  }

  a {
    color: inherit;
    text-decoration: none;
  }
</style>

<div class="button-tile bx--aspect-ratio bx--aspect-ratio--2x1">
  <div class="bx--aspect-ratio--object">
    {#if href}
      <a
        class="link"
        on:click
        target={kind === 'launch' ? '_blank' : undefined}
        rel={kind === 'launch' ? 'noopener noreferrer' : undefined}
        {href}>
        <div>
          <slot />
        </div>
        {#if iconLeft}
          <div class="icon icon--left">
            <svelte:component this={iconLeft} />
          </div>
        {/if}
        <div class="icon icon--right">
          <svelte:component this={iconRight} />
        </div>
      </a>
    {:else}
      <div role="button" tabindex="0" class="link" on:click {href}>
        <div>
          <slot />
        </div>
        {#if iconLeft}
          <div class="icon icon--left">
            <svelte:component this={iconLeft} />
          </div>
        {/if}
        <div class="icon icon--right">
          <svelte:component this={iconRight} />
        </div>
      </div>
    {/if}
    <div class="bg" />
  </div>
</div>
