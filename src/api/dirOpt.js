import db from '../utils/db'
import short from 'short-uuid'
import docOpt from './docOpt'

function insertDir(dirName, pid) {
  const pid2 = pid || 'root'
  const dirId = short.generate()
  db().get('directorys').push({
    id: dirId,
    createTime: new Date(),
    updateTime: new Date(),
    name: dirName,
    pid: pid2
  }).write()

  return dirId
}

function updateDir(dirName, id) {
  db().get('directorys').find({ id }).assign({ updateTime: new Date(), name: dirName }).write()
}

function listDir() {
  return db().get('directorys').sortBy(['createTime'], ['asc']).cloneDeep().value()
}

function deleteDir(dirId) {
  const obj = docOpt.listDoc(dirId)
  // 先删除文档
  docOpt.deleteDoc(obj.list.map(doc => doc.id))
  // 再删除目录
  db().get('directorys').remove(dir => obj.dirIds.includes(dir.id)).write()
  return obj.dirIds
}

export default { insertDir, updateDir, listDir, deleteDir }
