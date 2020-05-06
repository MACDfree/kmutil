import db from '../utils/db'

export function initNew(cb) {
  let per = 50
  cb(per)
  db().defaults({ directorys: [], tags: [], documents: [], docTags: [] }).write()
  per = 100
  cb(per)
}
