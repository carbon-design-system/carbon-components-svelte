import ConsumerOverrideFixture from "./ConsumerOverrideFixture.svelte";
import { mount } from "./mount";
// After ./mount, so the consumer sheet lands after all.css in the cascade.
import "./consumer-override.css";

mount(ConsumerOverrideFixture);
