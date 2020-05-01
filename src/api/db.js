import { DataBase } from '../utils/sql-util'
import { findChildIds } from '../utils/comm-func'
import { deleteFile } from '../utils/file-util'

/**
 * 新增文档
 * @param {Object} doc 文档信息
 */
export function newDoc(doc) {
  const dataBase = new DataBase()
  return dataBase.open().then(() => {
    return dataBase.run('insert into KM_DOCUMENT (create_time,update_time,title,content,type,directory_id,path) values ($createTime,$updateTime,$title,$content,$type,$directoryId,$path)',
      {
        $createTime: Math.floor(Date.now() / 1000),
        $updateTime: Math.floor(Date.now() / 1000),
        $title: '未命名',
        $content: '',
        $type: doc.type,
        $directoryId: doc.directoryId || 0,
        $path: doc.path
      })
  }).finally(() => {
    dataBase.close()
  })
}

/**
 * 查找文件夹下的所有文档
 * @param {int} directoryId 文件夹ID
 */
export function listDoc(directoryId) {
  const dataBase = new DataBase()
  const dirId = directoryId || 0
  let ret = null
  if (dirId === 0) {
    ret = dataBase.open().then(() => {
      return dataBase.all('select * from km_document order by create_time desc')
    }).then(rows => Promise.resolve({ rows }))
  } else {
    ret = dataBase.open().then(() => {
      return dataBase.all('select * from km_directory')
    }).then(rows => {
      const ids = [dirId]
      findChildIds(rows, dirId, ids)
      return dataBase.all('select * from km_document where directory_id in (' +
        ids.map(_ => '?') +
        ') order by create_time desc', ids).then(rows => Promise.resolve({ rows, dirIds: ids }))
    })
  }

  return ret.finally(() => {
    dataBase.close()
  })
}

export function listDirectory() {
  const dataBase = new DataBase()
  return dataBase.open().then(() => {
    return dataBase.all('select * from km_directory order by create_time')
  }).finally(() => {
    dataBase.close()
  })
}

export function listTag() {
  const dataBase = new DataBase()
  return dataBase.open().then(() => {
    return dataBase.all('select * from km_tag order by create_time desc')
  }).finally(() => {
    dataBase.close()
  })
}

export function deleteDirectory(directoryId) {
  const dataBase = new DataBase()
  return dataBase.open().then(() => {
    return listDoc(directoryId)
  }).then(obj => {
    dataBase.serialize(function () {
      dataBase.db.run('BEGIN')
      try {
        // 删除关联的文档
        dataBase.db.run(
          'delete from km_document where directory_id in (' +
          obj.dirIds.map(_ => '?') +
          ')',
          obj.dirIds
        )
        // 删除当前节点及其子节点
        dataBase.db.run(
          'delete from km_directory where id in (' +
          obj.dirIds.map(_ => '?') +
          ')',
          obj.dirIds
        )
        // 删除实体文件
        obj.rows.forEach(row => {
          if (row.PATH) {
            deleteFile(row.PATH)
          }
        })
        dataBase.db.run('COMMIT')
        return Promise.resolve(obj.dirIds)
      } catch (err) {
        dataBase.db.run('ROLLBACK')
        return Promise.reject(err)
      }
    })
  }).finally(() => {
    dataBase.close()
  })
}

export function deleteTag(tagId) {
  const dataBase = new DataBase()
  return dataBase.open().then(() => {
    dataBase.serialize(function () {
      dataBase.db.run('BEGIN')
      try {
        dataBase.db.run('DELETE FROM KM_DOC_TAG WHERE TAG_ID=?', [
          tagId
        ])
        dataBase.db.run('DELETE FROM KM_TAG WHERE ID=?', [tagId])
        dataBase.db.run('COMMIT')
        return Promise.resolve(tagId)
      } catch (err) {
        dataBase.db.run('ROLLBACK')
        return Promise.reject(err)
      }
    })
  }).finally(() => {
    dataBase.close()
  })
}

export function deleteDoc(doc) {
  const dataBase = new DataBase()
  return dataBase.open().then(() => {
    dataBase.serialize(function () {
      dataBase.db.run('BEGIN')
      try {
        dataBase.db.run('delete from km_document where id=?', doc.id)
        // 删除实体文件
        if (doc.path) {
          deleteFile(doc.path)
        }
        dataBase.db.run('COMMIT')
        return Promise.resolve()
      } catch (err) {
        dataBase.db.run('ROLLBACK')
        return Promise.reject(err)
      }
    })
  }).finally(() => {
    dataBase.close()
  })
}

export function addDocTag(tagName, docId) {
  const dataBase = new DataBase()
  return dataBase.open().then(() => {
    return dataBase.get('SELECT COUNT(*) a FROM KM_TAG WHERE NAME=?', [tagName])
  }).then(row => {
    dataBase.serialize(function () {
      dataBase.db.run('BEGIN')
      try {
        if (row.a === 0) {
          dataBase.db.run(
            'INSERT INTO KM_TAG (CREATE_TIME,UPDATE_TIME,NAME) VALUES ($createTime,$updateTime,$name)',
            {
              $createTime: Math.floor(Date.now() / 1000),
              $updateTime: Math.floor(Date.now() / 1000),
              $name: tagName
            }
          )
        }
        dataBase.db.run(
          'INSERT INTO KM_DOC_TAG (DOC_ID,TAG_ID) SELECT ' +
          docId +
          ' DOC_ID, ID TAG_ID FROM KM_TAG WHERE NAME=?',
          [tagName]
        )
        dataBase.db.run('COMMIT')
        return Promise.resolve()
      } catch (err2) {
        dataBase.db.run('ROLLBACK')
        return Promise.reject(err2)
      }
    })
  }).finally(() => {
    dataBase.close()
  })
}
