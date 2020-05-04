import global from '../utils/global'
import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'

export function initNew(cb) {
  let per = 10
  cb(per)
  const adapter = new FileSync(global().currentPath + '\\info.json')
  const db = low(adapter)
  per = 50
  cb(per)
  db.defaults({ directorys: [], tags: [], documents: [], docTags: [] }).write()
  per = 100
  cb(per)
}
