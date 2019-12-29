function css(array) {
  return array
    .map(item => {
      if (!item) return false;

      return Array.isArray(item)
        ? item.join(': ')
        : item.slice(-1) === ';'
        ? item.slice(0, -1)
        : item;
    })
    .filter(Boolean)
    .join('; ');
}

export { css };
