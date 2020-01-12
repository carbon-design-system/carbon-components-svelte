<script>
  import { link } from 'svelte-spa-router';
  import ThemePicker from '../components/ThemePicker.svelte';
</script>

<style>
  header {
    position: fixed;
    z-index: 9;
    display: flex;
    align-items: center;
    justify-content: space-between;
    top: 0;
    left: 0;
    width: 100%;
    height: 2.5rem;
    padding: 0 1rem;
    background-color: var(--cds-ui-01);
    border-bottom: 1px solid var(--cds-ui-03);
  }

  nav {
    display: flex;
    align-items: baseline;
  }

  .bx--link {
    font-size: 1rem;
    color: var(--cds-text-01);
  }

  .bx--link:hover {
    color: var(--cds-text-01);
    text-decoration: none;
  }

  .version {
    font-size: 0.75rem;
    color: var(--cds-text-02);
    margin-left: 0.5rem;
    margin-right: 1.5rem;
  }
</style>

<header>
  <nav>
    <a class="bx--link" href="/" use:link>
      Carbon Components
      <strong>Svelte</strong>
    </a>
    <span class="version">v0.2.1</span>
  </nav>
  <div>
    <ThemePicker />
  </div>
</header>
