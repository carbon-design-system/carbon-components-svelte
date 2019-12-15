const prefix = 'bx';

function cx(...items) {
  const classes = [];

  items.forEach(item => {
    if (typeof item === 'string') {
      if (item.slice(0, 2) === '--') {
        classes.push(`${prefix}${item}`);
      } else {
        classes.push(item);
      }
    }
  });

  return classes.join(' ');
}

export { cx };
