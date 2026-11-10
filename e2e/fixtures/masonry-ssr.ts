import { hydrate } from "svelte";
import MasonrySsrFixture from "./MasonrySsrFixture.svelte";
import "carbon-components-svelte/css/all.css";

// The test serves this page with the component already rendered on the
// server, and hydrates it here.
const target = document.getElementById("app");
const params = new URLSearchParams(location.search);
if (target)
  hydrate(MasonrySsrFixture, {
    target,
    props: {
      native: params.get("native") !== "0",
      hideUntilPlaced: params.get("hide") === "1",
    },
  });
