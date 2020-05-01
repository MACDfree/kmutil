import { remote } from 'electron'

export default function global() {
  const sharedObject = remote.getGlobal('sharedObject')

  if (!sharedObject) {
    throw new Error('sharedObject is null')
  }
  return { currentPath: sharedObject.currentPath }
}
