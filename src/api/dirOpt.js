import db from '../utils/db'
import short from 'short-uuid'

function insertDir(dirName, pid) {
  const pid2 = pid || 'root'
  return db().get('directorys').push({ id: short.generate(), createTime: new Date(), updateTime: new Date(), name: dirName, pid: pid2 }).write().id
}

function updateDir(dirName, id) {
  db().get('directorys').find({ id }).assign({ updateTime: new Date(), name: dirName }).write()
}

function listDir() {
  return db().get('directorys').sortBy(['createTime'], ['asc']).cloneDeep().value()
}

export default { insertDir, updateDir, listDir }
