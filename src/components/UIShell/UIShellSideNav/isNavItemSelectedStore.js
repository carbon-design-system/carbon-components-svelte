import { writable } from 'svelte/store';

const isSelectedStore = writable([undefined]);

const store = {
  subscribe: isSelectedStore.subscribe,
  setStoreValues: arrayOfObjs => {
    let storeNewData = [];
    arrayOfObjs.forEach(element => {
      let newItem = {};
      if (element.href) {
        newItem = {
          id: element.text,
          isSelected: false
        };

        storeNewData.push(newItem);
      } else {
        element.subMenu.forEach(subelement => {
          newItem = {
            id: subelement.text,
            isSelected: false
          };

          storeNewData.push(newItem);
        });
      }
    });

    isSelectedStore.set(storeNewData);
  },
  setSelected: id => {
    isSelectedStore.update(values => {
      const newValues = values.map(item => {
        if (item.id === id) {
          item.isSelected = true;
          return item;
        } else {
          item.isSelected = false;
          return item;
        }
      });

      return newValues;
    });
  },
  deselectAll: () => {
    isSelectedStore.update(values => {
      values.forEach(item => {
        item.isSelected = false;
        return item;
      });
    });
  },
  clear: () => {
    isSelectedStore.set(undefined);
  }
};

export default store;