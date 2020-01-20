<script>
  import Router from 'svelte-spa-router';
  import Component from './components/Component';
  import Header from './components/Header.svelte';
  import Home from './components/Home.svelte';
  import SideNav from './components/SideNav.svelte';
</script>

<Header />
<SideNav />
<Router routes={{ '/': Home, '/c': Component, '/c/*': Component }} />
