import { writable } from "svelte/store";

const data = [
  {
    href: "#",
    title: "Test title search 1",
    menu: "Test menu 1",
    description: "This is a description for seach #1",
  },
  {
    href: "#",
    title: "Changing text to simulate search",
    menu: "Test menu 2",
    description: "This is a description for seach #2",
  },
  {
    href: "#",
    title: "More testing texts",
    menu: "Test menu 3",
    description: "This is a description for seach #3",
  },
  {
    href: "#",
    title: "We can find here another test text",
    menu: "Test menu 4",
    description: "This is a description for seach #4",
  },
];

const globalStore = writable(undefined);

const store = {
  subscribe: globalStore.subscribe,
  search: (searchString) => {
    if (searchString.length > 1) {
      let resultSearch = [];

      data.forEach((item) => {
        if (item.title.toLowerCase().includes(searchString.toLowerCase())) {
          resultSearch.push(item);
        }
      });

      if (resultSearch.length > 0) {
        globalStore.set(resultSearch);
      } else {
        globalStore.set(undefined);
      }
    } else {
      globalStore.set(undefined);
    }
  },
  clear: () => {
    globalStore.set(undefined);
  },
};

export default store;
