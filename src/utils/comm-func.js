export function findChildIds(list, pid, deleteIds) {
  list.forEach(row => {
    if (row.pid === pid) {
      deleteIds.push(row.id)
      findChildIds(list, row.id, deleteIds)
    }
  })
}

export function findChildren(pid, list) {
  const nodes = []
  list.forEach(row => {
    if (row.pid === pid) {
      nodes.push({
        label: row.name,
        id: row.id,
        children: findChildren(row.id, list)
      })
    }
  })
  return nodes
}
