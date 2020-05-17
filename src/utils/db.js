import global from '../utils/global'
import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'
import pako from 'pako'

function pack(data) {
  return pako.deflate(JSON.stringify(data), { to: 'string' })
}

function unpack(data) {
  if (data.startsWith('{\n')) {
    return JSON.parse(data)
  } else {
    return JSON.parse(pako.inflate(data, { to: 'string' }))
  }
}

export default function db() {
  const adapter = new FileSync(global().currentPath + '\\info.json', {
    serialize: pack,
    deserialize: unpack
  })
  return low(adapter)
}
