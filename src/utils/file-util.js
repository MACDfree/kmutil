import fs from 'fs'
import short from 'short-uuid'
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
  const dirPath = currentPath + '\\attach\\' + moment().format('YYYYMM') + '\\' + short.generate()
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
  const dirPath = currentPath + '\\attach\\' + moment().format('YYYYMM') + '\\' + short.generate()
  mkDir(dirPath)
  const filePath = dirPath + '\\' + file.name
  fs.copyFileSync(file.path, filePath)
  return filePath.replace(currentPath + '\\attach\\', '')
}

export function deleteFile(innerFilePath) {
  const sharedObject = remote.getGlobal('sharedObject')
  if (!sharedObject || !sharedObject.currentPath) {
    throw new Error('currentPath is null')
  }
  const currentPath = sharedObject.currentPath
  const filePath = currentPath + '\\attach\\' + innerFilePath
  if (fs.existsSync(filePath)) {
    let dirPath = filePath.substring(0, filePath.lastIndexOf('\\'))
    deleteDir(dirPath)
    dirPath = dirPath.substring(0, dirPath.lastIndexOf('\\'))
    if (fs.readdirSync(dirPath).length === 0) {
      fs.rmdirSync(dirPath)
    }
  }
}

function deleteDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return
  }

  const files = fs.readdirSync(dirPath)
  files.forEach(file => {
    const filePath = dirPath + '\\' + file
    if (fs.statSync(filePath).isDirectory()) {
      deleteDir(filePath)
    } else {
      fs.unlinkSync(filePath)
    }
  })
  fs.rmdirSync(dirPath)
}
