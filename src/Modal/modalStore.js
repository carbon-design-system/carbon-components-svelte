import { writable } from "svelte/store";

export const modalsOpen = writable([]);

export const addModalId = (id) => modalsOpen.update((ids) => [...ids, id]);

export const removeModalId = (id) =>
  modalsOpen.update((ids) => ids.filter((_id) => _id !== id));
