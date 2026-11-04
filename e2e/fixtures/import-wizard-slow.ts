import ImportWizardFixture from "./ImportWizardFixture.svelte";
import { mount } from "./mount";

// A slow `onImport` with small chunks, so a test can cancel part way.
Object.assign(window, { __delay: 40, __chunk: 20 });
mount(ImportWizardFixture);
