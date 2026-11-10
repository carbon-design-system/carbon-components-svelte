import KeyValueEditorStressFixture from "./KeyValueEditorStressFixture.svelte";
import { mount } from "./mount";

declare global {
  interface Window {
    __kvReadyMs?: number;
  }
}

mount(KeyValueEditorStressFixture);
