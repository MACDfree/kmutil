import sq3 from 'sqlite3'
import global from './global'

const sqlite3 = sq3.verbose()

export class DataBase {
  constructor() {
    this.db = null
  }

  open() {
    return new Promise((resolve, reject) => {
      const currentPath = global().currentPath
      console.log(currentPath)
      this.db = new sqlite3.Database(currentPath + '\\info.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, err => {
        if (!err) {
          resolve(this.db)
        } else {
          reject(err)
        }
      })
    })
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close(err => {
        if (!err) {
          resolve()
        } else {
          reject(err)
        }
      })
    })
  }

  run(sql, param) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, param, err => {
        if (!err) {
          resolve()
        } else {
          reject(err)
        }
      })
    })
  }

  all(sql, param) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, param, (err, rows) => {
        if (!err) {
          resolve(rows)
        } else {
          reject(err)
        }
      })
    })
  }

  get(sql, param) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, param, (err, row) => {
        if (!err) {
          resolve(row)
        } else {
          reject(err)
        }
      })
    })
  }

  exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, err => {
        if (!err) {
          resolve()
        } else {
          reject(err)
        }
      })
    })
  }

  serialize(cb) {
    this.db.serialize(cb)
  }
}

// export default function sql(cb) {
//   const currentPath = global().currentPath
//   const conn = new sqlite3.cached.Database(currentPath + '\\info.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, err => {
//     if (!err) {
//       try {
//         cb(conn)
//       } catch (err2) {
//         console.log(err2)
//       }
//     } else {
//       console.log(err)
//     }
//   })
// }
