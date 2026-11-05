import PositioningStressFixture from "./PositioningStressFixture.svelte";
import { mount } from "./mount";
import { installStats } from "./positioning-stats";

// The package marks every file but the CSS as free of side effects, so a bare
// `import "./positioning-stats"` is dropped from a production build.
installStats();
mount(PositioningStressFixture);
