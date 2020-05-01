import sql from '../utils/sql-util'
import { findChildIds } from '../utils/comm-func'
import { deleteFile } from '../utils/file-util'

/**
 * 新增文档
 * @param {Object} doc 文档信息
 */
export function newDoc(doc) {
  return new Promise((resolve, reject) => {
    sql.run(
      'insert into KM_DOCUMENT (create_time,update_time,title,content,type,directory_id,path) values ($createTime,$updateTime,$title,$content,$type,$directoryId,$path)',
      {
        $createTime: Math.floor(Date.now() / 1000),
        $updateTime: Math.floor(Date.now() / 1000),
        $title: '未命名',
        $content: '',
        $type: doc.type,
        $directoryId: doc.directoryId || 0,
        $path: doc.path
      },
      function (err) {
        if (!err) {
          resolve()
        } else {
          reject(err)
        }
      }
    )
  })
}

/**
 * 查找文件夹下的所有文档
 * @param {int} directoryId 文件夹ID
 */
export function listDoc(directoryId) {
  return new Promise((resolve, reject) => {
    const dirId = directoryId || 0
    if (dirId === 0) {
      sql.all('select * from km_document order by create_time desc', function (
        err,
        rows
      ) {
        if (!err) {
          resolve({ rows })
        } else {
          reject(err)
        }
      })
    } else {
      sql.all('select * from km_directory', function (err, rows) {
        if (!err) {
          const ids = [dirId]
          findChildIds(rows, dirId, ids)
          sql.all(
            'select * from km_document where directory_id in (' +
            ids.map(_ => '?') +
            ') order by create_time desc',
            ids,
            function (err2, rows) {
              if (!err2) {
                resolve({ rows, dirIds: ids })
              } else {
                reject(err2)
              }
            }
          )
        } else {
          reject(err)
        }
      })
    }
  })
}

export function listDirectory() {
  return new Promise((resolve, reject) => {
    sql.all('select * from km_directory order by create_time', function (
      err,
      rows
    ) {
      if (!err) {
        resolve(rows)
      } else {
        reject(err)
      }
    })
  })
}

export function listTag() {
  return new Promise((resolve, reject) => {
    sql.all('select * from km_tag order by create_time desc', function (
      err,
      rows
    ) {
      if (!err) {
        resolve(rows)
      } else {
        reject(err)
      }
    })
  })
}

export function deleteDirectory(directoryId) {
  return new Promise((resolve, reject) => {
    listDoc(directoryId).then(obj => {
      // 查出所有要删除的文件夹id
      sql.serialize(function () {
        sql.run('BEGIN')
        try {
          // 删除关联的文档
          sql.run(
            'delete from km_document where directory_id in (' +
            obj.dirIds.map(_ => '?') +
            ')',
            obj.dirIds
          )
          // 删除当前节点及其子节点
          sql.run(
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
          sql.run('COMMIT')
          resolve(obj.dirIds)
        } catch (err) {
          sql.run('ROLLBACK')
          reject(err)
        }
      })
    })
  })
}
