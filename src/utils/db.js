import global from '../utils/global'
import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'

export default function db() {
  const adapter = new FileSync(global().currentPath + '\\info.json')
  return low(adapter)
}
