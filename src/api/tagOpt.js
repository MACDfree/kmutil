import db from '../utils/db'
import short from 'short-uuid'

function findTag(tagId) {
  return db().get('tags').find({ id: tagId }).cloneDeep().value()
}

function listDocTag(docId) {
  const tags = db().get('docTags').filter({ docId }).map(function (item) {
    return findTag(item.tagId)
  }).cloneDeep().value()
  return tags
}

function insertDocTag(tagName, docId) {
  let tagId = db().get('tags').find({ name: tagName }).get('id').value()
  if (!tagId) {
    tagId = short.generate()
    db().get('tags').push({
      id: tagId,
      createTime: new Date(),
      updateTime: new Date(),
      name: tagName
    }).write()
  }
  db().get('docTags').push({
    id: short.generate(),
    docId,
    tagId
  }).write()
}

function listTag() {
  return db().get('tags').cloneDeep().value()
}

function updateTag(tagId, tagName) {
  db().get('tags').find({ id: tagId }).assign({
    name: tagName,
    updateTag: new Date()
  }).write()
}

function deleteTag(tagId) {
  db().get('docTags').remove(docTag => docTag.tagId === tagId).write()
  db().get('tags').remove(tag => tag.id === tagId).write()
}

function deleteDocTag(tagName, docId) {
  const tagId = db().get('tags').find({ name: tagName }).get('id').value()
  db().get('docTags').remove(docTag => docTag.tagId === tagId && docTag.docId === docId).write()
}

function searchTag(queryStr) {
  return db().get('tags').filter(function (tag) {
    const reg = '.*' + queryStr + '.*'
    return new RegExp(reg).test(tag.name)
  }).value()
}

export default { findTag, listDocTag, insertDocTag, listTag, updateTag, deleteTag, deleteDocTag, searchTag }
