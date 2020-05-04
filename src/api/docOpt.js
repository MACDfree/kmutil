import db from '../utils/db'
import short from 'short-uuid'
import dirOpt from './dirOpt'
import { findChildIds } from '../utils/comm-func'
import { deleteFile } from '../utils/file-util'

function insertDoc(doc) {
  db().get('documents').push({
    id: short.generate(),
    createTime: new Date(),
    updateTime: new Date(),
    title: '未命名',
    content: '',
    type: doc.type,
    directoryId: doc.directoryId || 'root',
    path: doc.path
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

function updateDoc(docId, title, content) {
  db().get('documents').find({ id: docId }).assign({
    title,
    content,
    updateTime: new Date()
  }).write()
}

function listDocByTagId(tagId) {
  const docIds = listDocIdByTagId(tagId)
  return db().get('documents').filter(function (doc) {
    return docIds.includes(doc.id)
  }).sortBy(['createTime'], ['desc']).cloneDeep().value()
}

function listDocIdByTagId(tagId) {
  return db().get('docTags').filter({ tagId }).map('docId').uniq().cloneDeep().value()
}

function deleteDoc(docIds) {
  db().get('documents').remove(function (doc) {
    if (docIds) {
      const has = docIds.includes(doc.id)
      if (has && doc.path) {
        deleteFile(doc.path)
      }
    }
    return false
  }).write()
}

export default { insertDoc, listDoc, findDoc, updateDoc, listDocByTagId, deleteDoc }
