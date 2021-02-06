/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface FluidFormProps {}

export default class FluidForm extends SvelteComponentTyped<
  FluidFormProps,
  { submit: WindowEventMap["submit"] },
  { default: {} }
> {}
