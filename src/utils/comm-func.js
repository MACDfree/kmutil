export function findChildIds(list, pid, deleteIds) {
  list.forEach(row => {
    if (row.PARENT === pid) {
      deleteIds.push(row.ID)
      findChildIds(list, row.ID, deleteIds)
    }
  })
}

export function findChildren(parent, list) {
  const nodes = []
  list.forEach(row => {
    if (row.PARENT === parent) {
      nodes.push({
        label: row.NAME,
        id: row.ID,
        children: findChildren(row.ID, list)
      })
    }
  })
  return nodes
}
