export function findChildIds(list, pid, deleteIds) {
  list.forEach(row => {
    if (row.pid === pid) {
      deleteIds.push(row.id)
      findChildIds(list, row.id, deleteIds)
    }
  })
}

export function findChildren(pid, list, extFunc) {
  const nodes = []
  list.forEach(row => {
    if (row.pid === pid) {
      if (extFunc && typeof extFunc === 'function') {
        nodes.push({
          label: row.name,
          id: row.id,
          children: findChildren(row.id, list, extFunc),
          ...extFunc(row.id)
        })
      } else {
        nodes.push({
          label: row.name,
          id: row.id,
          children: findChildren(row.id, list)
        })
      }
    }
  })
  return nodes
}
