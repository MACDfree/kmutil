import fs from 'fs'
import uuid from 'node-uuid'
import { remote } from 'electron'
import moment from 'moment'
import path from 'path'

function mkDir(dirPath) {
  if (fs.existsSync(dirPath)) {
  } else {
    mkDir(path.dirname(dirPath))
    fs.mkdirSync(dirPath)
  }
}

export function createMDFile() {
  const sharedObject = remote.getGlobal('sharedObject')
  if (!sharedObject || !sharedObject.currentPath) {
    throw new Error('currentPath is null')
  }
  const currentPath = sharedObject.currentPath
  const dirPath = currentPath + '\\attach\\' + moment().format('YYYYMM') + '\\' + uuid.v4()
  mkDir(dirPath)
  const filePath = dirPath + '\\index.md'
  fs.writeFileSync(filePath, '# 未命名')
  return filePath.replace(currentPath + '\\attach\\', '')
}

export function copyFile(file) {
  const sharedObject = remote.getGlobal('sharedObject')
  if (!sharedObject || !sharedObject.currentPath) {
    throw new Error('currentPath is null')
  }
  const currentPath = sharedObject.currentPath
  const dirPath = currentPath + '\\attach\\' + moment().format('YYYYMM') + '\\' + uuid.v4()
  mkDir(dirPath)
  const filePath = dirPath + '\\' + file.name
  fs.copyFileSync(file.path, filePath)
  return filePath.replace(currentPath + '\\attach\\', '')
}
