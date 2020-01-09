<script>
  import ComponentLayout from './components/ComponentLayout.svelte';
  import ComponentSearch from './containers/ComponentSearch.svelte';
  import Header from './containers/Header.svelte';
  import Logo from './assets/logo.png';
  import Router from 'svelte-spa-router';
</script>

<style>
  nav {
    position: fixed;
    top: 2.5rem;
    left: 0;
    width: 14rem;
    height: calc(100% - 2.5rem);
    background-color: var(--cds-ui-01);
  }

  header {
    margin-top: 2.5rem;
    padding-left: 16rem;
  }
</style>

<Router routes={{ '/c/:name': ComponentLayout }} />

<Header />

<nav>
  <ComponentSearch />
</nav>

<header class="bx--grid">
  <div class="bx--row">
    <img src={Logo} alt="Logo" style="width: 4rem;" />
  </div>
</header>
