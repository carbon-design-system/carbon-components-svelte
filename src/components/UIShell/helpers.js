export function isChildOf(target, parentId) {
  if (target.id) {
    if (target.id == parentId) {
      return true;
    }
  }

  if (target.parentNode) {
    if (target.parentNode.id) {
      if (target.parentNode.id == parentId) {
        return true;
      } else {
        return isChildOf(target.parentNode, parentId);
      }
    } else {
      return isChildOf(target.parentNode, parentId);
    }
  } else {
    return false;
  }
}
