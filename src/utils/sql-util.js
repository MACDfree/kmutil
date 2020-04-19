import sq3 from 'sqlite3'
import { remote } from 'electron'

const sqlite3 = sq3.verbose()

function getDB() {
  const sharedObject = remote.getGlobal('sharedObject')
  if (!sharedObject || !sharedObject.currentPath) {
    throw new Error('currentPath is null')
  }
  const currentPath = sharedObject.currentPath
  const db = new sqlite3.cached.Database(currentPath + '\\info.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE)
  return db
}

export default getDB()
