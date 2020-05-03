import db from '../utils/db'
import short from 'short-uuid'
import dirOpt from './dirOpt'
import { findChildIds } from '../utils/comm-func'

function insertDoc(doc) {
  db().get('documents').push({
    id: short.generate(),
    createTime: new Date(),
    updateTime: new Date(),
    title: '未命名',
    content: '',
    type: doc.type,
    directoryId: doc.directoryId || 'root',
    path: doc.path,
    tags: []
  }).write()
}

function listDoc(dirId) {
  const dirIds = []
  if (dirId) {
    dirIds.push(dirId)
    const dirList = dirOpt.listDir()
    findChildIds(dirList, dirId, dirIds)
    return {
      list: db().get('documents').filter(function (doc) {
        return dirIds.includes(doc.directoryId)
      }).sortBy(['createTime'], ['desc']).cloneDeep().value(),
      dirIds
    }
  }
  return { list: db().get('documents').sortBy(['createTime'], ['desc']).cloneDeep().value() }
}

function findDoc(docId) {
  const doc = db().get('documents').find({ id: docId }).cloneDeep().value()
  return doc
}

export default { insertDoc, listDoc, findDoc }
