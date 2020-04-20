import { remote } from 'electron'

const sharedObject = remote.getGlobal('sharedObject')

if (!sharedObject) {
  throw new Error('sharedObject is null')
}

export default sharedObject
